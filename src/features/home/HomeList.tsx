import SearchBar from '../../components/SearchBar';
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import useTelegram from '../../hooks/use-telegram';
import { Api } from 'telegram';
import { Flex, Image, Masonry, Text } from 'gestalt';

type MessageElement = {
  url: string;
  width: number;
  height: number;
  text: string;
};

function GridComponent({ data }: { data: MessageElement }) {
  return (
    <Flex direction='column'>
      <Image
        alt={data.text}
        naturalHeight={data.height}
        naturalWidth={data.width}
        src={data.url}
      />
      <Text>{data.text}</Text>
    </Flex>
  );
}

export default function HomeList() {
  const LIMIT = 15;
  const telegram = useTelegram();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState<string>();
  const [results, setResults] = useState<Array<MessageElement>>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!searchValue || !telegram) {
      return;
    }
    console.log('search value has changed, searching...', { searchValue });

    (async () => {
      const client = await telegram.getClient();
      const messages = await client.getMessages(undefined, {
        search: searchValue,
        filter: new Api.InputMessagesFilterPhotos(),
        limit: LIMIT,
      });
      const promises = messages.map<Promise<MessageElement>>(
        async (message) => {
          const photo = message.photo as unknown as {
            sizes: Array<Api.PhotoSize>;
          };
          const sizePos = photo.sizes.length - 2;
          const size = photo.sizes[sizePos];
          const photoBuffer = (await client.downloadMedia(message, {
            thumb: sizePos,
          })) as unknown as Buffer;
          return {
            url: URL.createObjectURL(new Blob([photoBuffer])),
            height: size.h,
            width: size.w,
            text: message.text,
          };
        }
      );
      const data = await Promise.all(promises);
      setResults(data);
    })();
  }, [searchValue, telegram]);

  return (
    <>
      <SearchBar searchValueHandler={setSearchValue} />;
      <Masonry
        items={results}
        renderItem={({ data }) => <GridComponent data={data} />}
      />
    </>
  );
}
