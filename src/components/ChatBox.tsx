import {Avatar, Box, Fade, Flex, Heading, IconButton, Input, InputGroup, InputRightElement, Spinner, useBreakpoint, VStack } from "@chakra-ui/react";
import { collection, doc, DocumentData, orderBy, query, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import {ChangeEvent, useEffect, useRef, useState} from "react";
import {db} from "../config/firebase";
import {useAuth} from "../contexts/auth_context";
import {Message} from "../utils/typings";
import ChatMessage from "./ChatMessage";
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { SendIcon } from "../utils/icons";
import { nanoid } from 'nanoid'
import React from "react";
import {get_doc_by_id} from "../services/database_helpers";
import {ChevronLeftIcon} from "@chakra-ui/icons";



interface ChatBoxProps {
	chatroom_uid : string,
	set_chat_list_open: React.Dispatch<React.SetStateAction<any>>
}

const ChatBox = ( { chatroom_uid, set_chat_list_open } : ChatBoxProps ) => {
	// Input state
	const [ new_message, set_new_message ] = useState<string>( '' );

	const [ users, set_users ] = useState<DocumentData[]>([]);

	const messages_ref = collection( db, 'chatrooms', chatroom_uid, 'messages' );
	const messages_q = query( messages_ref, orderBy( 'timestamp' ) );
	const [ messages,loading ] = useCollectionData (messages_q, { idField: 'id' } );

	const { current_user } = useAuth();
	const { uid } = current_user

	// User that is not signed in user
	const chatter = users.find( user => user.id !== uid )


	const last_msg_ref = useRef<HTMLDivElement>( null )
	const scroll_to_bottom = () => {
		if( last_msg_ref.current ) {
			last_msg_ref.current.scrollIntoView( { behavior: 'smooth', block: 'nearest', inline: 'start' } );
		}
	}

	const current_breakpoint = useBreakpoint();

	useEffect( () => {
		get_doc_by_id( 'chatrooms', chatroom_uid )
			.then( doc => doc.data().members_uid )
			.then( members_uid => {
				members_uid.forEach( ( user_uid : string ) => {
					get_doc_by_id( 'users', user_uid )
						.then( doc => {
							const data = {
								id: doc.id,
								...doc.data()
							}
							set_users(oldState => [...oldState, data])
						} )
				} )
			} )
	}, [] )

	useEffect( scroll_to_bottom, [ messages ] )


	const message_form_handler = async ( e : ChangeEvent<HTMLFormElement> ) => {
		e.preventDefault();
		const timestamp = serverTimestamp()
		if( new_message.length > 0 ) {
			const message: Message = {
				text: new_message.trim(),
				timestamp: timestamp,
				user_uid : uid,
			}

			// reference to chatroom collection -> current chatroom ->
			// creates / finds messages subcollection -> creates new ID
			const new_message_ref = doc( db, 'chatrooms', chatroom_uid , 'messages', nanoid() );
			await setDoc( new_message_ref, message );

			const chatroom_ref = doc( db, 'chatrooms', chatroom_uid );
			await updateDoc( chatroom_ref, {
				last_msg_at: timestamp
			} )
			set_new_message( '' );
		}

	}

	const handle_new_message = ( e : ChangeEvent<HTMLInputElement> ) => {
		e.preventDefault();
		set_new_message( e.target.value );
	}


	return (
		<>
			{
				( current_breakpoint === 'base' || current_breakpoint === 'sm' || current_breakpoint === 'md' ) &&
				<Flex w='100%' background='white' p={ 4 } alignItems='center'>
					<IconButton onClick={ () => set_chat_list_open( true ) } variant='unstyled' mr={ 4 } icon={ <ChevronLeftIcon boxSize='2.3rem' /> } aria-label='Back' />
					<Avatar name={ chatter?.display_name }  mr={ 3 }/>
					<Heading fontWeight='500' size='lg'>{ chatter?.display_name }</Heading>
				</Flex>
			}
			<Flex flexDir='column' justifyContent='space-between' >
				<VStack spacing={ 5 } h={ ['75vh','90vh' ] } overflowY='auto'>
					<Fade in={ loading }>
						<Spinner position='absolute' top='50%' left='46%' />
					</Fade>
					{ messages &&
							messages.map( ( message )=> {
							return (
								<React.Fragment key={ message.id }>
									<ChatMessage timestamp={ message.timestamp?.toDate() } message={ message.text } sender_uid={ message.user_uid } received={ message.user_uid !== uid } key={ message.id }/>
								</React.Fragment>
							);
							} )
					}
					<Box ref={ last_msg_ref } w={[ '100vw', '100%' ]} />

				</VStack>
				<Fade in={ !loading }>
					<form onSubmit={ message_form_handler }>
						<Flex px={ [5,10] }>
							<InputGroup mt={ 10 }>
								<Input
									type='text'
									_hover={{ backgroundColor: 'white' }}
									_focus={{ backgroundColor : 'white' }}
									variant='filled'
									backgroundColor='white'
									py={ 6 }
									value={ new_message }
									onChange={ handle_new_message }
									placeholder='Enter a message'
									mr={ 3 }
								/>
								<InputRightElement right={ ['20px', '40px'] } top='10%' children={ <IconButton type='submit' variant='unstyled' _hover={{ transform: 'scale( 1.1 )' }} icon={<SendIcon width='30px' height='30px' color='teal.dark'/> } aria-label='Send message'/>} />
							</InputGroup>
						</Flex>
					</form>
				</Fade>
			</Flex>
		</>
	);
}
export default ChatBox;
