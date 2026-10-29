import { ScreenTitle } from "../ScreenTitle";

export function WelcomeScreen({ onConsent }: { readonly onConsent: () => void }) {
  return (
    <div className="sheet">
      <ScreenTitle eyebrow="Before we start">Help us test a campus storage idea</ScreenTitle>
      <p className="lede">
        We&apos;re a student team looking at how grad students find places to leave their things
        on campus.
      </p>
      <ul className="checklist">
        <li>It takes about 5 minutes.</li>
        <li>We&apos;re testing the idea, not you. There are no wrong answers.</li>
        <li>We don&apos;t collect your name, email, or phone number.</li>
        <li>You can stop at any time. Just close the page.</li>
      </ul>
      <div className="actions">
        <button type="button" className="btn btn-primary" onClick={onConsent}>
          I agree, let&apos;s start.
        </button>
      </div>
    </div>
  );
}
