import {Fade, Flex, IconButton, Input, InputGroup, InputRightElement, Spinner, VStack,} from "@chakra-ui/react";
import { collection, doc, orderBy, query, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import {ChangeEvent,   useEffect,   useRef,   useState} from "react";
import {db} from "../config/firebase";
import {useAuth} from "../contexts/auth_context";
import {Message} from "../utils/typings";
import ChatMessage from "./ChatMessage";
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { SendIcon } from "../utils/icons";
import { nanoid } from 'nanoid'
import React from "react";



interface ChatBoxProps {
	chatroom_uid : string
}

const ChatBox = ( { chatroom_uid } : ChatBoxProps ) => {
	// Input state
	const [ new_message, set_new_message ] = useState<string>( '' );

	const messages_ref = collection( db, 'chatrooms', chatroom_uid, 'messages' );
	const messages_q = query( messages_ref, orderBy( 'timestamp' ) );
	const [ messages,loading ] = useCollectionData (messages_q, { idField: 'id' } );

	const { current_user } = useAuth();
	const { uid } = current_user;

	const last_msg_ref = useRef<HTMLDivElement>( null )
	const scroll_to_bottom = () => {
		if( last_msg_ref.current ) {
			last_msg_ref.current.scrollIntoView( { behavior: 'smooth', block: 'nearest', inline: 'start' } );
		}
	}

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
		<Flex flexDir='column' justifyContent='space-between' >
			<VStack spacing={ 5 } h={ ['85vh','90vh' ] } overflowY='auto'>
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
				<div ref={ last_msg_ref } />
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
	);
}
export default ChatBox;
