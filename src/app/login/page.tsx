import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Sign in to Aperture
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Enter your credentials to access the platform
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}

