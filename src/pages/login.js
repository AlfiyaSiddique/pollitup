import React from 'react';

import initFirebase from '../lib/firebase';
import firebase from 'firebase/app';
import 'firebase/auth';
import { useAuth } from '../lib/auth';
import { addDoc, getDoc } from '../lib/db';

import { LoginForm } from "../components/loginForm";
import { DividerWithText } from '../components/dividerWithText';
import { FaGoogle } from 'react-icons/fa';

import {
  Container,
  Box,
  Heading,
  Text,
  Button,
  SimpleGrid,
  useColorModeValue as mode,
  VisuallyHidden,
  useToast,
} from '@chakra-ui/react';
import Link from '../components/link';
import validation from '../assets/validation';

export default function LoginPage() {
  initFirebase();
  const toast = useToast();
  const { user, loadingUser } = useAuth();
  const [loginForm, setLoginForm] = React.useState({
    email: "",
    password:""
  })
  const [error, setError] = React.useState({ email: true, password: true})

  React.useEffect(() => {
    if (user && !loadingUser) window.location.href = '/';
  }, [user, loadingUser]);

  const handleChange = (e)=>{
    const {name, value} = e.target;
    setLoginForm((prev)=>{
      return {...prev, [name]: value}
    })
    console.log(name)
    const errorMessage = validation[name](value);
    setError((prev)=>{
      return {...prev, ...errorMessage};
    })
  }

  async function signIn() {
    let submitable = true;
    Object.values(error).forEach((err)=>{
     if(err !== false){
       submitable = false;
       return;
     }
    })
    if(submitable){
    await firebase.auth().signInWithEmailAndPassword(loginForm.email, loginForm.password)
    .then((u) => { // u.user.uid
      window.location.href = '/';
    })
    .catch(function(err) {
      toast({
        title: "Error",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    });
  }else{
    return toast({
      title: "Error",
      description: "Please fill all Fields with Valid Data.",
      status: "error",
      duration: 5000,
      isClosable: true,
    });
  }
  }

  async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    await firebase.auth().signInWithRedirect(provider)
    .then(async (u) => {
      // If is new user, create doc in users col
      const existingUser = await getDoc('users', u.user.uid);
      if (!existingUser) {
        await addDoc('users', {
          displayName: "",
          description: "",
          logo: ""
        }, u.user.uid);
      }
      window.location.href = '/';
    })
    .catch(function(err) {
      toast({
        title: "Error",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    });;
  }

  if (!loadingUser && !user) return (
    <Container maxW="container.sm" p={8}>
      <Box bg={mode('gray.50', 'inherit')} minH="100vh" py="12" px={{ sm: '6', lg: '8' }}>
        <Box maxW={{ sm: 'md' }} mx={{ sm: 'auto' }} w={{ sm: 'full' }}>
          <Heading mt="6" textAlign="center" size="xl" fontWeight="extrabold">
            Log in to your account
          </Heading>
          <Text mt="4" align="center" maxW="md" fontWeight="medium">
            <span>Don&apos;t have an account?</span>
            <Box
              as="a"
              marginStart="1"
              href="#"
              color={mode('blue.600', 'blue.200')}
              _hover={{ color: 'blue.600' }}
              display={{ base: 'block', sm: 'revert' }}
            >
              <Link href="/register" color="brand.500">Register</Link>
            </Box>
          </Text>
        </Box>
        <Box maxW={{ sm: 'md' }} mx={{ sm: 'auto' }} mt="8" w={{ sm: 'full' }}>
          <Box
            bg={mode('white', 'gray.700')}
            py="8"
            px={{ base: '4', md: '10' }}
            shadow="base"
            rounded={{ sm: 'lg' }}
          >
            <LoginForm email = {loginForm.email} signIn = {signIn} password = {loginForm.password} change={handleChange} errorObj={error}/>
            <DividerWithText mt="6">or continue with</DividerWithText>
            <SimpleGrid mt="6" columns={1} spacing="3">
              <Button onClick={signInWithGoogle} color="currentColor" variant="outline">
                <VisuallyHidden>Sign in with Google</VisuallyHidden>
                <FaGoogle/>
              </Button>
            </SimpleGrid>
          </Box>
        </Box>
      </Box>
    </Container>
  );
  
  // Prevents flashing page when logged in
  return (<></>); // TODO: add loading page
}
