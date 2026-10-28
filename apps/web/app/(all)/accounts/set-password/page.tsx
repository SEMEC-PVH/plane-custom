/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { EAuthModes } from "@plane/constants";
// components
import { ResetPasswordForm } from "@/components/account/auth-forms/reset-password";
import { AuthHeader } from "@/components/auth-screens/header";
// SEMEC
import { SemecAuthShell } from "@/components/semec/brand";
// helpers
import { EPageTypes } from "@/helpers/authentication.helper";
// layouts
import DefaultLayout from "@/layouts/default-layout";
import { AuthenticationWrapper } from "@/lib/wrappers/authentication-wrapper";

function SetPasswordPage() {
  return (
    <DefaultLayout>
      <AuthenticationWrapper pageType={EPageTypes.SET_PASSWORD}>
        <SemecAuthShell showLockup>
          <AuthHeader type={EAuthModes.SIGN_IN} />
          <ResetPasswordForm />
        </SemecAuthShell>
      </AuthenticationWrapper>
    </DefaultLayout>
  );
}

export default SetPasswordPage;
