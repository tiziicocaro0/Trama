export default function Logo({ className = '' }) {
  return (
    <span className={`brand-logo ${className}`}>
      <img
        src="/assets/branding/image.png"
        alt="TRAMA"
        width="1774"
        height="887"
      />
    </span>
  )
}
