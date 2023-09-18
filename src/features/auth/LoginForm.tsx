import Joi from 'joi';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Callout,
  ComboBox,
  Container,
  Flex,
  Heading,
  TextField,
} from 'gestalt';
import { EventEmitter, promiseFromEvent } from '../../utils/event-emitter';
import { ComboBoxItem } from '../../types/common';
import { superTrim } from '../../utils/string';
import useCountries from '../../hooks/use-countries';
import useTelegram, { Country } from '../../hooks/use-telegram';
import { useAuth } from '../../hooks/use-auth';

export default function LoginForm() {
  const navigate = useNavigate();
  const telegram = useTelegram();
  const [lang] = useState('en');
  const [messageError, setMessageError] = useState<Joi.ValidationError>();
  const [country, setCountry] = useState<ComboBoxItem<Country>>();
  const [askPhoneCode, setAskPhoneCode] = useState(false);
  const [askPassword, setAskPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    phoneNumber: '',
    password: '',
    phoneCode: '',
  });
  const countries = useCountries({ lang, telegram });
  const { user, signIn } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/');
      return;
    }
  }, [navigate, user]);

  const validateNumber = async () => {
    const { countryCode, patterns } = country!.item.countryCodes.find(
      (cc) => country!.item.countryCode === cc.countryCode
    )!;

    const phoneNumberRegexes =
      patterns
        ?.map((pattern) => {
          const length = pattern.split(' ').join('').length;
          return `^\\+${countryCode}(\\d{${length}})$`;
        })
        .join('|') || `^\\+${countryCode}(\\d{9,12})$`; // generic solution for argentina and others
    const phoneNumberPattern = new RegExp(phoneNumberRegexes);
    const phoneNumberSchema = Joi.string()
      .regex(phoneNumberPattern)
      .required()
      .label('Phone number')
      .messages({
        'string.pattern.base': 'Phone number has an invalid value',
      });

    const { error } = phoneNumberSchema.validate(superTrim(form.phoneNumber));
    if (error) {
      setMessageError(error);
      return false;
    }
    return true;
  };

  const onContinueClick = async () => {
    if (form.phoneCode && form.password) {
      EventEmitter.dispatch('onPassword', form.password);
      return;
    }

    if (form.phoneCode) {
      setLoading(true);
      EventEmitter.dispatch('onPhoneCode', superTrim(form.phoneCode));
      return;
    }

    if (form.phoneNumber && !form.phoneCode) {
      const valid = await validateNumber();
      if (!valid) {
        return;
      }
      try {
        setLoading(true);
        signIn &&
          signIn({
            phoneNumber: () => superTrim(form.phoneNumber),
            password: async () => {
              setAskPassword(true);
              setLoading(false);
              return await promiseFromEvent('onPassword');
            },
            phoneCode: async () => {
              setAskPhoneCode(true);
              setLoading(false);
              return await promiseFromEvent('onPhoneCode');
            },
          });
      } catch (e) {
        console.error('error during login', { e });
      }
    }
  };

  return (
    <Container>
      <Flex
        alignItems='center'
        justifyContent='center'
        height='100vh'
        width='100%'
      >
        <Box
          width={400}
          height={500}
          padding={5}
          borderStyle='raisedBottomShadow'
        >
          <Heading align='center'>Printergram</Heading>

          <Box margin={5}>
            <ComboBox
              id='countries'
              label='Country'
              disabled={askPhoneCode}
              options={countries}
              selectedOption={country}
              onSelect={({ item }) => {
                setForm({
                  ...form,
                  phoneNumber: `+${item.value} `,
                });
                setCountry(
                  countries.find((country) => country.value === item.value)
                );
              }}
            />
          </Box>

          {country && (
            <Box margin={5}>
              <TextField
                id='phoneNumber'
                label='Phone number'
                value={form.phoneNumber}
                disabled={askPhoneCode}
                onChange={({ value }) => {
                  setForm({ ...form, phoneNumber: value });
                }}
              />
            </Box>
          )}

          {askPhoneCode && (
            <Box margin={5}>
              <TextField
                id='phoneCode'
                label='Phone code'
                type='tel'
                value={form.phoneCode}
                disabled={askPassword}
                onChange={({ value }) => {
                  setForm({ ...form, phoneCode: value });
                }}
              />
            </Box>
          )}

          {askPassword && (
            <Box margin={5}>
              <TextField
                id='password'
                label='Password'
                type='password'
                value={form.password}
                onChange={({ value }) => {
                  setForm({ ...form, password: value });
                }}
              />
            </Box>
          )}

          {country &&
            form.phoneNumber?.length > country.value.length + 2 &&
            !(
              (askPhoneCode && !form.phoneCode) ||
              (askPassword && !form.password)
            ) && (
              <Box margin={5} justifyContent='end' display='flex'>
                <Button
                  disabled={loading}
                  text='Continue'
                  onClick={() => onContinueClick()}
                />
              </Box>
            )}

          {messageError && (
            <Callout
              dismissButton={{
                accessibilityLabel: 'Dismiss this banner',
                onDismiss: () => setMessageError(undefined),
              }}
              iconAccessibilityLabel='error'
              message={messageError.message}
              title='An error has ocurred!'
              type='error'
            />
          )}
        </Box>
      </Flex>
    </Container>
  );
}
