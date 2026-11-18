function Icon({ name, size = 28 }) {
  const paths = {
    location: (
      <>
        <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    bag: (
      <>
        <path d="M5 7h14l1 14H4L5 7Z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </>
    ),
    phone: (
      <path d="m7 3 3 5-2 2a16 16 0 0 0 6 6l2-2 5 3-1 4C10 23 1 14 3 4l4-1Z" />
    ),
    email: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 6 9 7 9-7" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export default function Home() {
  const directions =
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent("Wijayaba Mawatha, Yakkala, Gampaha");

  return (
    <div className="brew-home" id="top">
      <header className="brew-header">
        <div className="brew-header-inner">
          <a href="/" className="brew-logo" aria-label="BrewDesk home">
            <span>BrewDesk</span>
            <small>Coffee, cakes &amp; more.</small>
          </a>

          <nav aria-label="Main navigation">
            <a href="/" aria-current="page">
              Home
            </a>
            <a href="/menu">Menu</a>
            <a href="/menu#bag">Your bag</a>
            <a href="/menu#my-order">Track order</a>
          </nav>
        </div>
      </header>

      <main className="brew-home-main">
        <section className="brew-welcome">
          <div className="brew-welcome-copy">
            <p className="brew-eyebrow">Your daily coffee moment</p>

            <h1>Welcome to BrewDesk</h1>

            <p>Coffee, cakes, and good moments.</p>

            <p>
              Choose your favourites online for pickup or delivery.
            </p>

            <a className="brew-button" href="/menu">
              Browse the menu <span aria-hidden="true">→</span>
            </a>
          </div>

          <img
            className="brew-welcome-image"
            src="/coffee-bakery-hero.png"
            alt="Iced coffee, a croissant, and cheesecake"
          />
        </section>

        <section className="brew-visit" id="visit">
          <h2>Visit our café</h2>

          <div className="brew-info-grid">
            <article className="brew-info-card">
              <Icon name="location" size={40} />

              <h3>Our branch</h3>

<address className="brew-branch-address">
  <span>Wijayaba Mawatha</span>
  <span>Yakkala</span>
  <span>Gampaha</span>
</address>

              <a
                className="brew-text-link"
                href={directions}
                target="_blank"
                rel="noopener noreferrer"
              >
                Get directions <span aria-hidden="true">↗</span>
              </a>
            </article>

            <article className="brew-info-card">
              <Icon name="clock" size={40} />

              <h3>Opening hours</h3>

              <div className="brew-opening-hours">
                <div>
                  <strong>Monday – Friday</strong>
                  <span>7:00 AM – 8:00 PM</span>
                </div>

                <div>
                  <strong>Saturday – Sunday</strong>
                  <span>8:00 AM – 9:00 PM</span>
                </div>
              </div>

              <a className="brew-text-link" href="tel:+94772315589">
                Call our café <span aria-hidden="true">↗</span>
              </a>
            </article>

            <article className="brew-info-card">
              <Icon name="bag" size={40} />

              <h3>Order your way</h3>

              <div className="brew-service-tags">
                <span>Pickup</span>
                <span>Delivery</span>
              </div>

              <p>Your café favourites, your way.</p>

              <a className="brew-button" href="/menu">
                Explore menu <span aria-hidden="true">→</span>
              </a>
            </article>
          </div>
        </section>
      </main>

      <section className="brew-contact" id="contact">
        <div className="brew-contact-inner">
          <div>
            <h2>Let’s talk over coffee.</h2>
            <p>We’d love to hear from you.</p>
          </div>

          <div className="brew-contact-links">
            <a href="tel:+94772315589">
              <Icon name="phone" />
              <span>077 231 5589</span>
            </a>

            <a href="mailto:brewdeskgampaha@gmail.com">
              <Icon name="email" />
              <span>brewdeskgampaha@gmail.com</span>
            </a>
          </div>
        </div>
      </section>

      <footer className="brew-footer">
        <small>© {new Date().getFullYear()} BrewDesk</small>

        <nav aria-label="Footer navigation">
          <a href="#contact">Contact</a>
          <a href="#top">Back to top ↑</a>
        </nav>
      </footer>
    </div>
  );
} 