import {Fade, Flex, Input, InputGroup, InputRightElement, Spinner} from "@chakra-ui/react";
import { collection, doc, orderBy, query, serverTimestamp, setDoc } from "firebase/firestore";
import {ChangeEvent,   useState} from "react";
import {db} from "../config/firebase";
import {useAuth} from "../contexts/auth_context";
import {Message} from "../utils/typings";
import ChatMessage from "./ChatMessage";
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { SendIcon } from "../utils/icons";
import { nanoid } from 'nanoid'


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


	const message_form_handler = async ( e : ChangeEvent<HTMLFormElement> ) => {
		e.preventDefault();
		if( new_message.length > 0 ) {
			const message: Message = {
				text: new_message.trim(),
				timestamp: serverTimestamp() ,
				user_uid : uid,
			}

			// reference to chatroom collection -> current chatroom ->
			// creates / finds messages subcollection -> creates new ID
			const ref = doc( db, 'chatrooms', chatroom_uid! , 'messages', nanoid() )
			await setDoc( ref, message )

			set_new_message( '' );
		}

	}

	const handle_new_message = ( e : ChangeEvent<HTMLInputElement> ) => {
		e.preventDefault();
		set_new_message( e.target.value );
	}

	return (
		<Flex flexDir='column' justifyContent='space-between' h='100%'>
			<Flex flexDir='column'>
				<Fade in={ loading }>
					<Spinner position='absolute' top='50%' left='46%' />
				</Fade>
				{ messages &&
						messages.map( message => {
							console.log( message )
						return (
							<ChatMessage timestamp={ message.timestamp.toDate() } message={ message.text } sender_uid={ message.user_uid } received={ message.user_uid !== uid } key={ message.timestamp }/>
						);
					} )
				}
			</Flex>
			<form onSubmit={ message_form_handler }>
				<Flex>
					<InputGroup mt={ 10 }>
						<Input type='text' _hover={{ backgroundColor: 'white' }} _focus={{ backgroundColor : 'white' }} variant='filled' backgroundColor='white' py={ 6 } value={ new_message } onChange={ handle_new_message } placeholder='Enter a message' mr={ 3 }/>
						<InputRightElement right='40px' top='10%' children={ <SendIcon width='20px' height='20px' /> } />
					</InputGroup>
				</Flex>
			</form>
		</Flex>
	);
}
export default ChatBox;
