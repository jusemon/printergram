import SearchBar from '../../components/SearchBar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import useTelegram from '../../hooks/use-telegram';
import { Api } from 'telegram';
import { Box, Flex, Image, Masonry, Text } from 'gestalt';
import { IterMessagesParams } from 'telegram/client/messages';

type MessageElement = {
  id: number;
  date: number;
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
  const LIMIT = 50;
  const telegram = useTelegram();
  const { user } = useAuth();
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [searchValue, setSearchValue] = useState<string>();
  const [results, setResults] = useState<Array<MessageElement>>([]);

  const loadItems = async (args: { from: number } | undefined) => {
    if (!searchValue || !telegram) return;

    const { from } = Object.assign({ from: 0 }, args);
    console.log({ from });
    const client = await telegram.getClient();
    const request = {
      search: searchValue,
      filter: new Api.InputMessagesFilterPhotos(),
      offsetId: results.length > 0 ? results.at(from - 1)?.id : 0,
      limit: LIMIT,
    };
    // const messages = await client.getMessages(undefined, request); // Change undefined by channel id or entity
  };

  const performSearch = async (
    args: { from: number } | undefined = undefined
  ) => {
    if (!searchValue || !telegram) return;
    const { from } = Object.assign({ from: 0 }, args);
    const client = await telegram.getClient();
    const getMessagesProps: Partial<IterMessagesParams> = {
      search: searchValue,
      filter: new Api.InputMessagesFilterPhotos(),
      ...(from > 0
        ? { offsetDate: results.at(from - 1)?.date }
        : { offsetDate: new Date().getTime() / 1000 }),
      limit: LIMIT,
    };

    // const channels = await client.getEntity('@printergram');
    // console.log({ channels });

    const messages = await client.getMessages(undefined, getMessagesProps);
    const messagesWithPhotosPromise = messages.map(async (message) => {
      if (!message.photo) {
        return null;
      }

      const photo = message.photo as unknown as {
        id: number;
        sizes: Array<Api.PhotoSize>;
      };
      const sizePos = photo.sizes.length - 2;
      const size = photo.sizes[sizePos];
      const photoBuffer = (await client.downloadMedia(message, {
        thumb: sizePos,
      })) as unknown as Buffer;
      const data = {
        id: message.id,
        url: URL.createObjectURL(new Blob([photoBuffer])),
        height: size.h,
        width: size.w,
        text: message.text,
      };
      return data;
    });
    const messagesWithPhotos = (
      await Promise.all(messagesWithPhotosPromise)
    ).filter((message) => message !== null) as Array<MessageElement>;
    setResults(messagesWithPhotos);
  };

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
    performSearch();
    setResults([]);
  }, [searchValue, telegram]);

  return (
    <>
      <SearchBar searchValueHandler={setSearchValue} />;
      <Box
        minHeight='calc(100vh - 130px)'
        marginStart='auto'
        marginEnd='auto'
        ref={(el) => (scrollContainerRef.current = el)}
        width='100%'
      >
        {scrollContainerRef.current && (
          <Masonry
            scrollContainer={() => scrollContainerRef.current!}
            loadItems={loadItems}
            virtualize={true}
            items={results}
            renderItem={({ data }) => <GridComponent data={data} />}
          />
        )}
      </Box>
    </>
  );
}
