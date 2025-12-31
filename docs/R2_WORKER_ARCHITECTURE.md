# R2 + Worker PDF Processing Architecture

This document outlines the architecture for uploading PDFs to Cloudflare R2 and processing them with a Worker service.

## Architecture Overview

```
User Upload → Next.js API → R2 Storage → Cloudflare Worker → Processed Text → Database/API
```

## Components Needed

### 1. Cloudflare R2 Setup

**Required:**
- R2 bucket (e.g., `epistemic-papers`)
- R2 API credentials (Access Key ID + Secret Access Key)
- CORS configuration for direct browser uploads (optional)

**Environment Variables:**
```env
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=epistemic-papers
R2_PUBLIC_URL=https://your-bucket.r2.dev (if using public bucket)
```

### 2. Cloudflare Worker Service

**Worker Responsibilities:**
- Listen for PDF upload events (via R2 webhooks or queue)
- Download PDF from R2
- Process PDF using `pdf-parse` or similar
- Store extracted text back to R2 or send to your API
- Handle errors and retries

**Worker Dependencies:**
- `pdf-parse` (or `pdfjs-dist` for Workers)
- R2 API client

### 3. Next.js API Routes

**New Routes Needed:**
- `POST /api/upload/presigned-url` - Generate presigned upload URL
- `POST /api/upload/complete` - Mark upload complete, trigger processing
- `GET /api/upload/status/:jobId` - Check processing status
- `POST /api/upload/webhook` - Receive webhook from worker (optional)

## Implementation Steps

### Step 1: Install R2 Client

```bash
pnpm add @aws-sdk/client-s3
# R2 is S3-compatible, so we use AWS SDK
```

### Step 2: Create R2 Client Utility

```typescript
// lib/r2-client.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadToR2(key: string, file: Buffer, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    Body: file,
    ContentType: contentType,
  });
  
  return await r2Client.send(command);
}

export async function getFromR2(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
  });
  
  const response = await r2Client.send(command);
  const chunks: Uint8Array[] = [];
  
  for await (const chunk of response.Body as any) {
    chunks.push(chunk);
  }
  
  return Buffer.concat(chunks);
}
```

### Step 3: Create Upload API Route

```typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/r2-client";
import { getUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Generate unique key for R2
    const fileId = uuidv4();
    const key = `papers/${user.id}/${fileId}/${file.name}`;
    
    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    await uploadToR2(key, buffer, file.type);
    
    // Create processing job record
    const job = await prisma.processingJob.create({
      data: {
        id: fileId,
        userId: user.id,
        fileName: file.name,
        r2Key: key,
        status: "uploaded",
      },
    });

    // Trigger worker processing (via queue or HTTP)
    await triggerWorkerProcessing(fileId, key);

    return NextResponse.json({
      jobId: fileId,
      status: "uploaded",
      message: "File uploaded, processing started",
    });
  } catch (error) {
    console.error("[Upload] Error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}

async function triggerWorkerProcessing(jobId: string, r2Key: string) {
  // Option 1: HTTP request to worker
  await fetch(`${process.env.WORKER_URL}/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId, r2Key }),
  });
  
  // Option 2: Use Cloudflare Queue (better for reliability)
  // await queue.send({ jobId, r2Key });
}
```

### Step 4: Create Status Check API

```typescript
// app/api/upload/status/[jobId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = await getUser();
    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;
    
    const job = await prisma.processingJob.findUnique({
      where: { id: jobId },
    });

    if (!job || job.userId !== user.id) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: job.status,
      extractedText: job.extractedText,
      error: job.error,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get status" },
      { status: 500 }
    );
  }
}
```

### Step 5: Update Prisma Schema

```prisma
model ProcessingJob {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  fileName     String
  r2Key        String
  status       String   // "uploaded" | "processing" | "completed" | "failed"
  extractedText String? @db.Text
  error        String?  @db.Text
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([userId])
  @@index([status])
}
```

### Step 6: Create Cloudflare Worker

```typescript
// worker/src/index.ts
import { processPDF } from "./pdf-processor";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "POST" && request.url.endsWith("/process")) {
      const { jobId, r2Key } = await request.json();
      
      try {
        // Update job status to processing
        await updateJobStatus(jobId, "processing");
        
        // Download PDF from R2
        const pdfBuffer = await downloadFromR2(env, r2Key);
        
        // Process PDF
        const extractedText = await processPDF(pdfBuffer);
        
        // Store result back to R2 or send to API
        await storeResult(env, jobId, extractedText);
        
        // Update job status
        await updateJobStatus(jobId, "completed", extractedText);
        
        return new Response(JSON.stringify({ success: true }));
      } catch (error) {
        await updateJobStatus(jobId, "failed", null, error.message);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
        });
      }
    }
    
    return new Response("Not found", { status: 404 });
  },
};

async function downloadFromR2(env: Env, key: string): Promise<ArrayBuffer> {
  const object = await env.R2_BUCKET.get(key);
  if (!object) throw new Error("File not found in R2");
  return await object.arrayBuffer();
}

async function updateJobStatus(
  jobId: string,
  status: string,
  extractedText?: string,
  error?: string
) {
  await fetch(`${env.API_URL}/api/upload/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId, status, extractedText, error }),
  });
}
```

### Step 7: Update Frontend Component

```typescript
// app/preflight/components/PaperUpload.tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsProcessing(true);
  setProcessingProgress("Uploading file...");

  try {
    if (uploadMethod === "file" && file) {
      // Upload to R2 via API
      const formData = new FormData();
      formData.append("file", file);
      
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      const { jobId } = await uploadResponse.json();
      
      // Poll for completion
      setProcessingProgress("Processing PDF...");
      const text = await pollForCompletion(jobId);
      
      // Continue with analysis
      onSubmit(text, file);
    }
  } catch (error) {
    // Handle error
  } finally {
    setIsProcessing(false);
  }
};

async function pollForCompletion(jobId: string): Promise<string> {
  const maxAttempts = 60; // 5 minutes max
  const pollInterval = 5000; // 5 seconds
  
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`/api/upload/status/${jobId}`);
    const { status, extractedText, error } = await response.json();
    
    if (status === "completed") {
      return extractedText;
    }
    
    if (status === "failed") {
      throw new Error(error || "Processing failed");
    }
    
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  throw new Error("Processing timeout");
}
```

## Alternative: Direct Browser Upload to R2

For better performance, you can generate presigned URLs and upload directly from the browser:

```typescript
// app/api/upload/presigned-url/route.ts
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export async function POST(request: NextRequest) {
  const { fileName, contentType } = await request.json();
  const key = `papers/${userId}/${uuidv4()}/${fileName}`;
  
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  });
  
  const presignedUrl = await getSignedUrl(r2Client, command, {
    expiresIn: 3600, // 1 hour
  });
  
  return NextResponse.json({ presignedUrl, key });
}
```

## Database Migration

```bash
pnpm prisma migrate dev --name add_processing_jobs
```

## Cost Considerations

**R2:**
- Storage: $0.015/GB/month
- Class A operations (writes): $4.50/million
- Class B operations (reads): $0.36/million

**Workers:**
- Free tier: 100,000 requests/day
- Paid: $5/month for 10M requests

## Benefits of This Architecture

1. **No size limits** - R2 can handle files of any size
2. **Scalable** - Workers auto-scale
3. **Reliable** - Queue-based processing with retries
4. **Cost-effective** - Pay only for what you use
5. **Fast** - Direct browser uploads possible

## Trade-offs

1. **Complexity** - More moving parts
2. **Latency** - Async processing (polling required)
3. **Cost** - Additional services to manage
4. **Development** - Need to set up Worker development environment

