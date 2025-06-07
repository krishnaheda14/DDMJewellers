import { useLocation } from "wouter";

export default function Footer() {
  const [, navigate] = useLocation();

  const quickLinks = [
    { name: "About Us", href: "#" },
    { name: "Collections", href: "/products" },
    { name: "Custom Design", href: "#" },
    { name: "Care Guide", href: "#" },
  ];

  const customerService = [
    { name: "Contact Us", href: "#" },
    { name: "Size Guide", href: "#" },
    { name: "Shipping Info", href: "#" },
    { name: "Returns", href: "#" },
  ];

  const collections = [
    { name: "Wedding Jewelry", href: "/products?search=wedding" },
    { name: "Diamond Collection", href: "/products?search=diamond" },
    { name: "Gold Jewelry", href: "/products?search=gold" },
    { name: "Silver Collection", href: "/products?search=silver" },
    { name: "Precious Stones", href: "/products?search=precious" },
  ];

  const services = [
    { name: "Custom Design", href: "#" },
    { name: "Jewelry Repair", href: "#" },
    { name: "Cleaning & Care", href: "#" },
    { name: "Consultation", href: "#" },
    { name: "Appraisal", href: "#" },
  ];

  return (
    <footer className="bg-deep-navy text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-2xl font-bold text-gold mb-4">DDM Jewellers</h3>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Creating timeless jewelry pieces since 1985. Experience luxury, quality, and craftsmanship in every design.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="w-10 h-10 bg-gold rounded-full flex items-center justify-center hover:bg-gold/80 transition-colors"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gold rounded-full flex items-center justify-center hover:bg-gold/80 transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987c6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297c-.875-.807-1.376-1.888-1.376-3.091c0-1.203.501-2.284 1.376-3.091c.875-.807 2.026-1.297 3.323-1.297c1.297 0 2.448.49 3.323 1.297c.875.807 1.376 1.888 1.376 3.091c0 1.203-.501 2.284-1.376 3.091c-.875.807-2.026 1.297-3.323 1.297zm7.718-6.943H14.82v-1.297h1.347v1.297zm0-2.595H14.82V6.153h1.347v1.297z"/>
                </svg>
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gold rounded-full flex items-center justify-center hover:bg-gold/80 transition-colors"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gold rounded-full flex items-center justify-center hover:bg-gold/80 transition-colors"
                aria-label="Pinterest"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174c-.105-.949-.199-2.403.041-3.439c.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911c1.024 0 1.518.769 1.518 1.688c0 1.029-.653 2.567-.992 3.992c-.285 1.193.6 2.165 1.775 2.165c2.128 0 3.768-2.245 3.768-5.487c0-2.861-2.063-4.869-5.008-4.869c-3.41 0-5.409 2.562-5.409 5.199c0 1.033.394 2.143.889 2.741c.099.12.112.225.085.345c-.09.375-.293 1.199-.334 1.363c-.053.225-.172.271-.402.165c-1.495-.69-2.433-2.878-2.433-4.646c0-3.776 2.748-7.252 7.92-7.252c4.158 0 7.392 2.967 7.392 6.923c0 4.135-2.607 7.462-6.233 7.462c-1.214 0-2.357-.629-2.748-1.378c0 0-.594 2.267-.744 2.84c-.282 1.079-1.048 2.436-1.555 3.267C9.602 23.812 10.763 24.001 12.017 24.001c6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001 12.017.001z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Collections */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Collections</h4>
            <ul className="space-y-3">
              {collections.map((item) => (
                <li key={item.name}>
                  <button
                    onClick={() => navigate(item.href)}
                    className="text-gray-300 hover:text-gold transition-colors"
                  >
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Services</h4>
            <ul className="space-y-3">
              {services.map((item) => (
                <li key={item.name}>
                  <a href={item.href} className="text-gray-300 hover:text-gold transition-colors">
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Contact</h4>
            <div className="space-y-3">
              <p className="text-gray-300 flex items-center">
                <svg className="w-4 h-4 mr-3 text-gold" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                123 Jewelry District<br />Mumbai, India 400001
              </p>
              <p className="text-gray-300 flex items-center">
                <svg className="w-4 h-4 mr-3 text-gold" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
                +91 98765 43210
              </p>
              <p className="text-gray-300 flex items-center">
                <svg className="w-4 h-4 mr-3 text-gold" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                info@ddmjewellers.com
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-300 text-sm">© 2024 DDM Jewellers. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-300 hover:text-gold transition-colors text-sm">
              Privacy Policy
            </a>
            <a href="#" className="text-gray-300 hover:text-gold transition-colors text-sm">
              Terms of Service
            </a>
            <a href="#" className="text-gray-300 hover:text-gold transition-colors text-sm">
              Return Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
