export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to K-Fin
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Your financial analysis platform
        </p>
        <div className="space-x-4">
          <a
            href="/auth/login"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-yellow-700 hover:bg-yellow-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            Sign In
          </a>
        </div>
      </div>
    </div>
  );
}
