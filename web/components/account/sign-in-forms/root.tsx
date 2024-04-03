import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
// components
import {
  SignInEmailForm,
  SignInUniqueCodeForm,
  SignInPasswordForm,
  OAuthOptions,
  SignInOptionalSetPasswordForm,
} from "@/components/account";
import { LatestFeatureBlock } from "@/components/common";
// constants
import { NAVIGATE_TO_SIGNUP } from "@/constants/event-tracker";
// hooks
import { useEventTracker, useInstance } from "@/hooks/store";
import useSignInRedirection from "@/hooks/use-sign-in-redirection";

export enum ESignInSteps {
  EMAIL = "EMAIL",
  PASSWORD = "PASSWORD",
  UNIQUE_CODE = "UNIQUE_CODE",
  OPTIONAL_SET_PASSWORD = "OPTIONAL_SET_PASSWORD",
  USE_UNIQUE_CODE_FROM_PASSWORD = "USE_UNIQUE_CODE_FROM_PASSWORD",
}

export const SignInRoot = observer(() => {
  // states
  const [signInStep, setSignInStep] = useState<ESignInSteps | null>(null);
  const [email, setEmail] = useState("");
  // sign in redirection hook
  const { handleRedirection } = useSignInRedirection();
  // hooks
  const { instance } = useInstance();
  const { captureEvent } = useEventTracker();
  // derived values
  const isSmtpConfigured = instance?.config?.is_smtp_configured;

  // step 1 submit handler- email verification
  const handleEmailVerification = (isPasswordAutoset: boolean) => {
    if (isSmtpConfigured && isPasswordAutoset) setSignInStep(ESignInSteps.UNIQUE_CODE);
    else setSignInStep(ESignInSteps.PASSWORD);
  };

  // step 2 submit handler- unique code sign in
  const handleUniqueCodeSignIn = async (isPasswordAutoset: boolean) => {
    if (isPasswordAutoset) setSignInStep(ESignInSteps.OPTIONAL_SET_PASSWORD);
    else await handleRedirection();
  };

  // step 3 submit handler- password sign in
  const handlePasswordSignIn = async () => {
    await handleRedirection();
  };

  const isOAuthEnabled =
    instance?.config && (instance?.config?.is_google_enabled || instance?.config?.is_github_enabled);

  useEffect(() => {
    if (isSmtpConfigured) setSignInStep(ESignInSteps.EMAIL);
    else setSignInStep(ESignInSteps.PASSWORD);
  }, [isSmtpConfigured]);

  return (
    <>
      <div className="mx-auto flex flex-col">
        <>
          {signInStep === ESignInSteps.EMAIL && (
            <SignInEmailForm onSubmit={handleEmailVerification} updateEmail={(newEmail) => setEmail(newEmail)} />
          )}
          {signInStep === ESignInSteps.UNIQUE_CODE && (
            <SignInUniqueCodeForm
              email={email}
              handleEmailClear={() => {
                setEmail("");
                setSignInStep(ESignInSteps.EMAIL);
              }}
              onSubmit={handleUniqueCodeSignIn}
              submitButtonText="Continue"
            />
          )}
          {signInStep === ESignInSteps.PASSWORD && (
            <SignInPasswordForm
              email={email}
              handleEmailClear={() => {
                setEmail("");
                setSignInStep(ESignInSteps.EMAIL);
              }}
              onSubmit={handlePasswordSignIn}
              handleStepChange={(step) => setSignInStep(step)}
            />
          )}
          {signInStep === ESignInSteps.USE_UNIQUE_CODE_FROM_PASSWORD && (
            <SignInUniqueCodeForm
              email={email}
              handleEmailClear={() => {
                setEmail("");
                setSignInStep(ESignInSteps.EMAIL);
              }}
              onSubmit={handleUniqueCodeSignIn}
              submitButtonText="Go to workspace"
            />
          )}
          {signInStep === ESignInSteps.OPTIONAL_SET_PASSWORD && (
            <SignInOptionalSetPasswordForm email={email} handleSignInRedirection={handleRedirection} />
          )}
        </>
      </div>

      {isOAuthEnabled &&
        (signInStep === ESignInSteps.EMAIL || (!isSmtpConfigured && signInStep === ESignInSteps.PASSWORD)) && (
          <>
            <OAuthOptions />
            <p className="mt-6 text-center text-xs text-onboarding-text-300">
              Don{"'"}t have an account?{" "}
              <Link
                href="/accounts/sign-up"
                onClick={() => captureEvent(NAVIGATE_TO_SIGNUP, {})}
                className="font-medium text-custom-primary-100 underline"
              >
                Sign up
              </Link>
            </p>
          </>
        )}
      <LatestFeatureBlock />
    </>
  );
});
