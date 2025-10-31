import bcrypt from 'bcryptjs';

export class BcryptUtil {
  private static readonly SALT_ROUNDS = 12;

  public static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.SALT_ROUNDS);
  }

  public static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  public static async hashData(data: string): Promise<string> {
    return await bcrypt.hash(data, this.SALT_ROUNDS);
  }

  public static async compareData(data: string, hashedData: string): Promise<boolean> {
    return await bcrypt.compare(data, hashedData);
  }
}
