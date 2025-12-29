export class ResponseUtil {
  static success<T>(data: T, message?: string) {
    return {
      success: true,
      message,
      data,
    };
  }

  static error(message: string, error?: any) {
    return {
      success: false,
      message,
      error,
    };
  }
}
