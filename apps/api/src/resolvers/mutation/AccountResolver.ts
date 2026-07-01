import { GraphQLError } from "graphql";
import bcrypt from "bcryptjs";
import { IAccountRepository } from "../../repositories/IAccountRepository.js";

const SALT_ROUNDS = 10;
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 16;
const MIN_PASSWORD_LENGTH = 4;

interface AuthPayloadDTO {
  playerId: string;
  displayName: string;
  token: string;
}

export class AccountResolver {
  constructor(private readonly accountRepo: IAccountRepository) {}

  async registerPlayer(args: {
    displayName: string;
    password: string;
  }): Promise<AuthPayloadDTO> {
    const displayName = args.displayName.trim();

    if (displayName.length < MIN_NAME_LENGTH || displayName.length > MAX_NAME_LENGTH) {
      throw new GraphQLError(
        `Display name must be between ${MIN_NAME_LENGTH} and ${MAX_NAME_LENGTH} characters`,
        { extensions: { code: "INVALID_NAME" } },
      );
    }
    if (args.password.length < MIN_PASSWORD_LENGTH) {
      throw new GraphQLError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
        { extensions: { code: "INVALID_PASSWORD" } },
      );
    }

    const playerId = globalThis.crypto.randomUUID();
    const passwordHash = await bcrypt.hash(args.password, SALT_ROUNDS);

    const created = await this.accountRepo.register({ playerId, displayName, passwordHash });
    if (!created) {
      throw new GraphQLError("This name is already taken", {
        extensions: { code: "NAME_TAKEN" },
      });
    }

    const token = globalThis.crypto.randomUUID();
    await this.accountRepo.saveToken(token, playerId);

    return { playerId, displayName, token };
  }

  async loginPlayer(args: {
    displayName: string;
    password: string;
  }): Promise<AuthPayloadDTO> {
    const account = await this.accountRepo.findByName(args.displayName.trim());
    if (!account) {
      throw new GraphQLError("Invalid name or password", {
        extensions: { code: "INVALID_CREDENTIALS" },
      });
    }

    const valid = await bcrypt.compare(args.password, account.passwordHash);
    if (!valid) {
      throw new GraphQLError("Invalid name or password", {
        extensions: { code: "INVALID_CREDENTIALS" },
      });
    }

    const token = globalThis.crypto.randomUUID();
    await this.accountRepo.saveToken(token, account.playerId);

    return { playerId: account.playerId, displayName: account.displayName, token };
  }
}
