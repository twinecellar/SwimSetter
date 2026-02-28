import { AuthForm } from "./AuthForm";

interface AuthPageProps {
  searchParams: { invite?: string };
}

export default function AuthPage({ searchParams }: AuthPageProps) {
  const inviteToken = searchParams.invite ?? null;
  return (
    <div className="mx-auto max-w-md">
      <AuthForm inviteToken={inviteToken} />
    </div>
  );
}
