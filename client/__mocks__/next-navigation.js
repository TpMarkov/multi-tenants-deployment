// Minimal stub for next/navigation so component tests don't pull in the
// full Next.js runtime.
export const useRouter = () => ({
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  prefetch: jest.fn(),
  refresh: jest.fn(),
});

export const usePathname = () => '/admin/dashboard';
export const useSearchParams = () => new URLSearchParams();
export const useParams = () => ({});
