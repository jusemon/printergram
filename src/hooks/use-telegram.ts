import { useCallback, useEffect, useState } from 'react';
import { Api, TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { decrypt, generateKeyPair } from '../utils/encryption';
import axios from 'axios';
import { API } from '../config/constants';
import { decodeBase64, encodeBase64 } from 'tweetnacl-util';
import { box } from 'tweetnacl';

type TelegramConfig = { apiId: number; apiHash: string };
export type Country = Api.help.Country & { countryCode: string };

export type TelegramWrapperLoginParams = {
  phoneNumber: () => Promise<string> | string;
  phoneCode: () => Promise<string> | string;
  password: () => Promise<string> | string;
  onError?: Function;
};

class TelegramWrapper {
  private _client: TelegramClient;
  private _connect: Promise<void>;
  private static _instance: TelegramWrapper;
  static config: TelegramConfig;
  public static get instance(): TelegramWrapper {
    if (!TelegramWrapper._instance) {
      TelegramWrapper._instance = new TelegramWrapper();
    }
    return TelegramWrapper._instance;
  }
  private _isLogged: boolean = false;
  public get isLogged(): boolean {
    return this._isLogged;
  }
  private set isLogged(value: boolean) {
    this._isLogged = value;
  }

  async login({
    phoneNumber,
    password,
    phoneCode,
    onError,
  }: TelegramWrapperLoginParams) {
    await this._client.start({
      phoneNumber: async () => await phoneNumber(),
      password: async () => await password(),
      phoneCode: async () => await phoneCode(),
      onError: (err: any) =>
        typeof onError !== 'undefined' ? onError(err) : console.error(err),
    });
    this.isLogged = true;
    const stringSession = this._client.session.save() as unknown as string;
    localStorage.setItem('session', stringSession);
    return await this.getMe();
  }

  async logout() {
    this.isLogged = false;
    localStorage.removeItem('session');
    return await this._client.invoke(new Api.auth.LogOut());
  }

  async getMe() {
    return await this._client.getMe();
  }

  async getProfilePic() {
    const data = await this._client.downloadProfilePhoto('me');
    if (!data || data.length === 0) {
      return '';
    }
    const blob = new Blob([data], { type: 'image/jpg' });
    return URL.createObjectURL(blob);
  }

  async getChannels() {
    return await this._client.getDialogs();
  }

  async messageMe(message: string) {
    await this._client.sendMessage('me', { message });
  }

  async getClient() {
    if (!this._client.connected) {
      await this._connect;
    }
    return this._client;
  }

  private constructor() {
    const { apiId, apiHash } = TelegramWrapper.config;
    let stringSession = localStorage.getItem('session') || '';
    this.isLogged = stringSession.length > 0;
    const session = new StringSession(stringSession);
    this._client = new TelegramClient(session, apiId, apiHash, {
      connectionRetries: 3,
    });
    this._connect = this._client.connect();
  }
}

export type Telegram = TelegramWrapper;

function getTelegram(apiId?: number, apiHash?: string) {
  if (apiId) {
    TelegramWrapper.config = { ...(TelegramWrapper.config || {}), apiId };
  }
  if (apiHash) {
    TelegramWrapper.config = { ...(TelegramWrapper.config || {}), apiHash };
  }
  return TelegramWrapper.instance;
}

export default function useTelegram() {
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>();
  const [telegram, setTelegram] = useState<TelegramWrapper>();

  const setupTelegramConfig = useCallback(async () => {
    const pairA = generateKeyPair();
    const { data } = await axios.get(`${API}/secrets/telegram`, {
      headers: {
        'public-key': encodeBase64(pairA.publicKey),
      },
    });
    const sharedA = box.before(decodeBase64(data.publicKey), pairA.secretKey);
    const keys = decrypt(sharedA, data.value);
    const { apiId, apiHash } = keys;
    setTelegramConfig({ apiHash, apiId });
  }, []);

  const setupHook = useCallback(async () => {
    if (!telegramConfig) {
      return;
    }
    const { apiId, apiHash } = telegramConfig;
    setTelegram(getTelegram(apiId, apiHash));
  }, [telegramConfig]);

  useEffect(() => {
    setupTelegramConfig();
  }, [setupTelegramConfig]);

  useEffect(() => {
    setupHook();
  }, [setupHook]);

  return telegram;
}
