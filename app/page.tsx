import Link from "next/link";
import styles from "./page.module.css";

export default function LandingPage() {
  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          See How Your Paper Will Be Read — Before Reviewers Do
        </h1>
        <p className={styles.heroSubtitle}>
          Epistemic Preflight helps early-career researchers position their work
          clearly, surface reviewer risks, and identify synthesis opportunities
          — before submission.
        </p>
        <p className={styles.heroAudience}>
          Built for Assistant Professors and early-career PIs working at the
          edge of their field.
        </p>
        <div className={styles.ctaContainer}>
          <Link href="/preflight" className={styles.ctaPrimary}>
            Upload a Paper
          </Link>
          <Link href="#learn-more" className={styles.ctaSecondary}>
            Learn More
          </Link>
        </div>
      </section>

      {/* The Problem Section */}
      <section id="learn-more" className={styles.section}>
        <h2 className={styles.sectionTitle}>
          The Problem (You Already Know This Feeling)
        </h2>
        <p className={styles.sectionText}>
          You don't worry about whether your work is good. You worry about:
        </p>
        <ul className={styles.problemList}>
          <li>being misunderstood</li>
          <li>being positioned as derivative</li>
          <li>picking the wrong fight</li>
          <li>Reviewer #2 attacking your framing instead of your results</li>
          <li>missing a synthesis opportunity someone else publishes first</li>
        </ul>
        <p className={styles.sectionText}>
          Most rejections aren't about correctness. They're about positioning,
          responsibility, and framing. And there's no good way to test that
          before peer review.
        </p>
      </section>

      {/* What It Does Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>What Epistemic Preflight Does</h2>
        <p className={styles.sectionText}>
          Epistemic Preflight is a pre-review analysis tool for research papers.
        </p>
        <p className={styles.sectionText}>
          You upload your draft. You select a few neighboring papers. The system
          shows you — structurally — how your work will be read.
        </p>
        <p className={styles.sectionText}>
          <strong>Not opinions. Not writing suggestions. Epistemic structure.</strong>
        </p>
      </section>

      {/* What You Get Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>What You Get (Concrete Outputs)</h2>
        
        <div className={styles.feature}>
          <h3 className={styles.featureTitle}>1. Claim Map of Your Paper</h3>
          <p className={styles.featureText}>
            A clear breakdown of: your core claims, which are foundational vs
            downstream, where you're making implicit assumptions. You see your
            paper the way a careful reviewer does.
          </p>
        </div>

        <div className={styles.feature}>
          <h3 className={styles.featureTitle}>2. Overlap & Conflict Analysis</h3>
          <p className={styles.featureText}>
            We compare your claims against relevant literature and show: where
            you genuinely overlap, where you directly conflict, where you're
            orthogonal (novel but unconnected). This answers the question
            reviewers always ask silently: "How does this actually differ from
            X?"
          </p>
        </div>

        <div className={styles.feature}>
          <h3 className={styles.featureTitle}>3. Reviewer Risk Report</h3>
          <p className={styles.featureText}>
            A short, actionable report highlighting: claims most likely to be
            challenged, where you may be over-claiming, framing vulnerabilities,
            likely points of misunderstanding. This is pre-mortem peer review.
          </p>
        </div>

        <div className={styles.feature}>
          <h3 className={styles.featureTitle}>4. Synthesis Opportunities (Optional)</h3>
          <p className={styles.featureText}>
            If your work sits between frameworks, we surface: possible synthesis
            framings, boundary reframings that reduce hostility, ways to
            subsume disagreement instead of escalating it. This is especially
            valuable for interdisciplinary or theory-building work.
          </p>
        </div>
      </section>

      {/* What This Is Not Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>What This Is Not</h2>
        <ul className={styles.notList}>
          <li>❌ Not an AI writing tool</li>
          <li>❌ Not a citation generator</li>
          <li>❌ Not automated peer review</li>
          <li>❌ Not a replacement for judgment</li>
        </ul>
        <p className={styles.sectionText}>
          Epistemic Preflight doesn't tell you what to believe. It shows you
          where responsibility and disagreement actually live.
        </p>
      </section>

      {/* Why This Matters Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Why This Matters for Early-Career PIs
        </h2>
        <p className={styles.sectionText}>
          On the tenure clock, the cost of one bad cycle is enormous.
        </p>
        <p className={styles.sectionText}>
          Epistemic Preflight helps you: reduce surprise rejections, choose
          which disagreements are worth owning, make your contribution legible,
          publish with confidence, not guesswork.
        </p>
        <p className={styles.sectionText}>
          <strong>This is epistemic risk reduction.</strong>
        </p>
      </section>

      {/* How It Works Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>How It Works</h2>
        <ol className={styles.howItWorksList}>
          <li>Upload your paper (PDF or Markdown)</li>
          <li>Select 1–3 comparator papers (or let us suggest them)</li>
          <li>Choose your intent: theory, synthesis, or empirical contribution</li>
          <li>Receive a structured analysis in minutes</li>
        </ol>
        <p className={styles.sectionText}>
          Everything is traceable. Nothing is hidden behind "AI said so."
        </p>
      </section>

      {/* Who It's For Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Who It's For</h2>
        <ul className={styles.whoList}>
          <li>Assistant Professors</li>
          <li>Early-career PIs</li>
          <li>Interdisciplinary researchers</li>
          <li>Theory builders</li>
          <li>Anyone publishing work that challenges existing frameworks</li>
        </ul>
        <p className={styles.sectionText}>
          If your work lives at boundaries, this tool was built for you.
        </p>
      </section>

      {/* Pricing Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Pricing (Early Access)</h2>
        <p className={styles.sectionText}>
          Individual researcher: $50/month or $500/year
        </p>
        <p className={styles.sectionText}>
          Lab / group access coming soon
        </p>
        <p className={styles.sectionText}>
          Cancel anytime. Your work remains yours.
        </p>
      </section>

      {/* Final CTA */}
      <section className={styles.finalCta}>
        <p className={styles.finalCtaText}>
          Epistemic Preflight helps you see where your paper stands — and where
          it might fail — before peer review decides for you.
        </p>
        <Link href="/preflight" className={styles.ctaPrimary}>
          Upload a Paper for Preflight Analysis
        </Link>
      </section>
    </div>
  );
}

