import { Box, Container, Flex, Heading, Text } from 'gestalt';
import { useRouteError } from 'react-router-dom';
type ErrorType = { statusText?: string; message?: string };
export default function Error() {
  const error = useRouteError() as ErrorType;
  console.error(error);

  return (
    <Container>
      <Flex
        alignItems='center'
        justifyContent='center'
        height='calc(100vh - 100px)'
        width='100%'
      >
        <Box height='100px'>
          <Heading>Oops!</Heading>
          <Text>Sorry, an unexpected error has occurred.</Text>
          <Text italic>{error.statusText || error.message}</Text>
        </Box>
      </Flex>
    </Container>
  );
}
