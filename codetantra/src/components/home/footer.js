import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-blue-600 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">CodeTantra SRM</h3>
            <p className="text-blue-100">
              Empowering students with cutting-edge learning solutions.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/elab" className="text-blue-100 hover:text-white transition-colors duration-200">
                  E-Lab
                </Link>
              </li>
              <li>
                <Link href="/test" className="text-blue-100 hover:text-white transition-colors duration-200">
                  Test
                </Link>
              </li>
              <li>
                <Link href="/features" className="text-blue-100 hover:text-white transition-colors duration-200">
                  Features
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Account</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/login" className="text-blue-100 hover:text-white transition-colors duration-200">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-blue-100 hover:text-white transition-colors duration-200">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <p className="text-blue-100">
              SRM Institute of Science and Technology<br />
              Kattankulathur, Chennai
            </p>
          </div>
        </div>
        <div className="border-t border-blue-500 mt-8 pt-6 text-center text-blue-100">
          <p>&copy; {new Date().getFullYear()} CodeTantra SRM. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
