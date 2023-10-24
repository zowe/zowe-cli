/**
 * Specifies wwhether questions can be asked of the user, and if not,
 * what value should be used for a question when we do not ask.
 */
export interface IDaemonEnableQuestions {
    canAskUser: boolean;
    addBinToPathVal: string;
}
