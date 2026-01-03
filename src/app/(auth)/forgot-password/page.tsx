import { Customer } from "@putiikkipalvelu/storefront-sdk";
import ForgotPasswordForm from "@/components/Auth/ForgotPasswordForm";
import { getUser } from "@/lib/actions/authActions";
import { redirect } from "next/navigation";

const ForgotPasswordPage = async () => {
  const { user }: { user: Customer | null } = await getUser();

  if (user) {
    // If user is already logged in, redirect to mypage
    redirect("/mypage");
  }

  return <ForgotPasswordForm />;
};

export default ForgotPasswordPage;
