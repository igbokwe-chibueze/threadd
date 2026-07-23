type AuthenticationEmail = Readonly<{
  subject: string;
  textBody: string;
}>;

export function createVerificationEmail(
  name: string,
  verificationUrl: string,
): AuthenticationEmail {
  return {
    subject: "Verify your THREADD email",
    textBody: [
      `Hello ${name},`,
      "",
      "Verify your email address to finish setting up your THREADD account:",
      verificationUrl,
      "",
      "This link expires in one hour.",
      "",
      "THREADD",
    ].join("\n"),
  };
}

export function createPasswordResetEmail(
  name: string,
  resetUrl: string,
): AuthenticationEmail {
  return {
    subject: "Reset your THREADD password",
    textBody: [
      `Hello ${name},`,
      "",
      "Use this secure link to choose a new THREADD password:",
      resetUrl,
      "",
      "This link expires in one hour. If you did not request it, you can ignore this message.",
      "",
      "THREADD",
    ].join("\n"),
  };
}
