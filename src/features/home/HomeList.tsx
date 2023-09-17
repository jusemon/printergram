import { Navigate, useNavigation } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth';
import {
  Avatar,
  Box,
  CompositeZIndex,
  Dropdown,
  FixedZIndex,
  Flex,
  Heading,
  Masonry,
  SearchField,
  TapArea,
  Text,
} from 'gestalt';
import { Fragment, useRef, useState } from 'react';

export default function HomeList() {
  const PAGE_HEADER_ZINDEX = new FixedZIndex(10);
  const { user, photo, signOut } = useAuth();
  const { location } = useNavigation();
  const [searchValue, setSearchValue] = useState('');
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  console.log(open);

  if (!user) {
    return <Navigate to={'/login'} state={{ from: location }} />;
  }

  return (
    <Fragment>
      <Flex direction='column'>
        <Box
          padding={8}
          height='100%'
          display='flex'
          alignItems='center'
          justifyContent='center'
        >
          <Flex alignItems='center' flex='grow' gap={{ row: 4, column: 0 }}>
            <Heading>Printergram</Heading>
            <Flex.Item flex='grow'>
              <SearchField
                accessibilityLabel='Search all of Printergram'
                accessibilityClearButtonLabel='Clear search field'
                id='searchField'
                onChange={({ value }) => setSearchValue(value)}
                placeholder='Search and explore'
                value={searchValue}
              />
            </Flex.Item>
            <TapArea onTap={() => setOpen((value) => !value)} ref={anchorRef}>
              <Avatar
                size='sm'
                name={user.firstName || user.name || 'p'}
                src={photo}
              />
            </TapArea>
          </Flex>
        </Box>
        <Masonry
          items={[{ id: 1, content: '' }]}
          renderItem={({ data }) => <>{data.content}</>}
        ></Masonry>
      </Flex>
      {open && (
        <Dropdown
          anchor={anchorRef.current}
          id='custom-dropdown-example'
          onDismiss={() => setOpen(false)}
          zIndex={new CompositeZIndex([PAGE_HEADER_ZINDEX])}
        >
          <Dropdown.Section label='Currently in'>
            <Dropdown.Link
              href='#'
              option={{ value: 'item 1', label: 'Custom link 1' }}
              onClick={({ event }) => event.preventDefault()}
            >
              <Box width='100%'>
                <Flex gap={2} alignItems='center'>
                  <Avatar name='Tia' size='md' src={photo} />
                  <Flex direction='column'>
                    <Text>{user.firstName || user.username}</Text>
                    <Text size='200' color='subtle'>
                      +{user.phone}
                    </Text>
                  </Flex>
                </Flex>
              </Box>
            </Dropdown.Link>
          </Dropdown.Section>
          <Dropdown.Section label='More options'>
            <Dropdown.Link
              href='#'
              option={{ value: 'logout', label: 'Log out' }}
              onClick={() => signOut && signOut()}
            />
          </Dropdown.Section>
        </Dropdown>
      )}
    </Fragment>
  );
}
