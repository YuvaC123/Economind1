interface SendOtpParams {
    email: string;
    name: string;
    otp: string;
}
export declare function sendOtpEmail({ email, name, otp }: SendOtpParams): Promise<{
    success: boolean;
    devMode: boolean;
}>;
export {};
//# sourceMappingURL=mailer.d.ts.map