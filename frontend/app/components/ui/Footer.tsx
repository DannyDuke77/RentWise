import Link from "next/link";
import Image from "next/image";
import { Globe, Smartphone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image
                  src="/rentwise_logo.jpeg"
                  alt="RentWise Logo"
                  width={32}
                  height={32}
                  className="rounded-lg"
                  unoptimized
                />
                <span className="text-lg font-bold text-white">RentWise</span>
              </div>
              <p className="text-gray-400 text-sm mb-6">
                Modern property management software for landlords and property managers.
              </p>
              <div className="flex items-center gap-4">
                <Globe className="w-5 h-5 text-gray-500" />
                <Smartphone className="w-5 h-5 text-gray-500" />
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="#features" className="text-gray-400 hover:text-white text-sm">Features</Link></li>
                <li><Link href="#pricing" className="text-gray-400 hover:text-white text-sm">Pricing</Link></li>
                <li><Link href="/demo" className="text-gray-400 hover:text-white text-sm">Demo</Link></li>
                <li><Link href="/updates" className="text-gray-400 hover:text-white text-sm">Updates</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-gray-400 hover:text-white text-sm">About Us</Link></li>
                <li><Link href="/careers" className="text-gray-400 hover:text-white text-sm">Careers</Link></li>
                <li><Link href="/blog" className="text-gray-400 hover:text-white text-sm">Blog</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white text-sm">Contact</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-gray-400 hover:text-white text-sm">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-white text-sm">Terms of Service</Link></li>
                <li><Link href="/security" className="text-gray-400 hover:text-white text-sm">Security</Link></li>
                <li><Link href="/compliance" className="text-gray-400 hover:text-white text-sm">Compliance</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">
              © 2024 RentWise. All rights reserved.
            </p>
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <Link href="/twitter" className="text-gray-500 hover:text-white text-sm">
                Twitter
              </Link>
              <Link href="/linkedin" className="text-gray-500 hover:text-white text-sm">
                LinkedIn
              </Link>
              <Link href="/facebook" className="text-gray-500 hover:text-white text-sm">
                Facebook
              </Link>
            </div>
          </div>
        </div>
      </footer>
  );
};

export default Footer;
