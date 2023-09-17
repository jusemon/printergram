import { useCallback, useEffect, useState } from 'react';
import { Country, Telegram } from './use-telegram';
import { Api } from 'telegram';
import { ComboBoxItem } from '../types/common';

type UseCountriesConfig = {
  lang: string;
  telegram?: Telegram;
};

export default function useCountries({ telegram, lang }: UseCountriesConfig) {
  const [countries, setCountries] = useState<Array<ComboBoxItem<Country>>>([]);
  const setupHook = useCallback(async () => {
    if (!telegram) {
      return;
    }
    const telegramClient = await telegram.getClient();
    const countryList = await telegramClient.invoke(
      new Api.help.GetCountriesList({ langCode: lang })
    );
    const { countries } = countryList as unknown as Api.help.CountriesList;
    const countriesWithCode = countries.flatMap<Country>((c) =>
      c.countryCodes.map((cc) =>
        Object.assign({ countryCode: cc.countryCode }, c)
      )
    );

    setCountries(
      countriesWithCode.map((item) => ({
        value: item.countryCode,
        label: `${item.name || item.defaultName} (+${item.countryCode})`,
        item,
      }))
    );
  }, [telegram, lang]);

  useEffect(() => {
    setupHook();
  }, [setupHook]);

  return countries;
}
