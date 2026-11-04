import { gql } from '@apollo/client';

/** the fields a car card shows */
const CAR_CARD_FIELDS = gql`
  fragment CarCardFields on Car {
    _id
    carTitle
    carBrand
    carYear
    carMileage
    carPrice
    carPriceUsd
    carFuelType
    carTransmission
    carLocation
    carImages
    carTestDrive
    createdAt
    agentData {
      _id
      memberNick
      agentCompany
    }
    meLiked {
      myFavorite
    }
  }
`;

/** a page of cars for sale (backend API.md §7). The next page: the same input with cursor = nextCursor */
export const GET_CARS = gql`
  ${CAR_CARD_FIELDS}
  query GetCars($input: CarsInquiry!) {
    getCars(input: $input) {
      list {
        ...CarCardFields
      }
      nextCursor
    }
  }
`;

/** one car with everything for its page */
export const GET_CAR = gql`
  ${CAR_CARD_FIELDS}
  query GetCar($carId: String!) {
    getCar(carId: $carId) {
      ...CarCardFields
      carType
      carModel
      carColor
      carCondition
      carMarket
      carAddress
      carDesc
      carOptions
      carBarter
      carRent
      carViews
      carLikes
      carStatus
      agentData {
        _id
        memberNick
        memberImage
        agentCompany
        contactPhone
        contactKakao
        contactTelegram
        contactWhatsapp
      }
    }
  }
`;

/** like / un-like (toggle). Returns the car with its new count */
export const LIKE_CAR = gql`
  mutation LikeCar($carId: String!) {
    likeTargetCar(carId: $carId) {
      _id
      carLikes
      meLiked {
        myFavorite
      }
    }
  }
`;

/** a buyer asks the dealer for a date (in the future, within 60 days) */
export const REQUEST_TEST_DRIVE = gql`
  mutation RequestTestDrive($input: TestDriveInput!) {
    requestTestDrive(input: $input) {
      _id
      testDriveDate
      testDriveStatus
    }
  }
`;

export interface CarListItem {
  _id: string;
  carTitle: string;
  carBrand: string;
  carYear: number;
  carMileage: number;
  carPrice?: number | null;
  carPriceUsd?: number | null;
  carFuelType: string;
  carTransmission: string;
  carLocation: string;
  carImages: string[];
  carTestDrive: boolean;
  createdAt: string;
  agentData?: { _id: string; memberNick: string; agentCompany?: string | null } | null;
  meLiked?: { myFavorite: boolean }[] | null;
}

export interface CarDetail extends CarListItem {
  carType: string;
  carModel: string;
  carColor: string;
  carCondition: string;
  carMarket: string;
  carAddress: string;
  carDesc?: string | null;
  carOptions: string[];
  carBarter: boolean;
  carRent: boolean;
  carViews: number;
  carLikes: number;
  carStatus: string;
  agentData?: {
    _id: string;
    memberNick: string;
    memberImage?: string | null;
    agentCompany?: string | null;
    contactPhone?: string | null;
    contactKakao?: string | null;
    contactTelegram?: string | null;
    contactWhatsapp?: string | null;
  } | null;
}

export interface GetCarsData {
  getCars: { list: CarListItem[]; nextCursor?: string | null };
}

export interface GetCarData {
  getCar: CarDetail;
}

/** my own profile: private fields (phone, full name) come back only with my access token */
export const GET_MY_PROFILE = gql`
  query GetMyProfile($targetId: String!) {
    getMember(targetId: $targetId, countView: false) {
      _id
      memberNick
      memberType
      memberPhone
      memberFullName
      agentCompany
    }
  }
`;

export interface GetMyProfileData {
  getMember: {
    _id: string;
    memberNick: string;
    memberType: string;
    memberPhone?: string | null;
    memberFullName?: string | null;
    agentCompany?: string | null;
  };
}

/* ---- private messages between a buyer and a dealer (backend API.md §17) ---- */

const CONVERSATION_FIELDS = gql`
  fragment ConversationFields on Conversation {
    _id
    buyerId
    agentId
    partner {
      _id
      memberNick
      memberImage
      memberType
      agentCompany
    }
    carData {
      _id
      carTitle
      carImages
      carPrice
      carPriceUsd
      carStatus
    }
    lastMessageText
    lastSenderId
    lastMessageAt
    myUnread
    partnerReadAt
  }
`;

export const GET_CONVERSATIONS = gql`
  ${CONVERSATION_FIELDS}
  query GetConversations($input: ConversationsInquiry!) {
    getConversations(input: $input) {
      total
      list {
        ...ConversationFields
      }
    }
  }
`;

export const START_CONVERSATION = gql`
  ${CONVERSATION_FIELDS}
  mutation StartConversation($input: StartConversationInput!) {
    startConversation(input: $input) {
      ...ConversationFields
    }
  }
`;

const MESSAGE_FIELDS = gql`
  fragment MessageFields on PrivateMessage {
    _id
    conversationId
    senderId
    messageType
    messageText
    messageImage
    carId
    carData {
      _id
      carTitle
      carImages
      carPrice
      carPriceUsd
      carStatus
    }
    createdAt
  }
`;

export const GET_MESSAGES = gql`
  ${MESSAGE_FIELDS}
  query GetMessages($input: MessagesInquiry!) {
    getMessages(input: $input) {
      ...MessageFields
    }
  }
`;

export const SEND_MESSAGE = gql`
  ${MESSAGE_FIELDS}
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      ...MessageFields
    }
  }
`;

export const MARK_CONVERSATION_READ = gql`
  mutation MarkConversationRead($conversationId: String!) {
    markConversationRead(conversationId: $conversationId)
  }
`;

export const GET_UNREAD_MESSAGE_COUNT = gql`
  query GetUnreadMessageCount {
    getUnreadMessageCount
  }
`;

export interface ChatCar {
  _id: string;
  carTitle: string;
  carImages: string[];
  carPrice?: number | null;
  carPriceUsd?: number | null;
  carStatus: string;
}

export interface ConversationItem {
  _id: string;
  buyerId: string;
  agentId: string;
  partner?: { _id: string; memberNick: string; memberImage?: string | null; memberType: string; agentCompany?: string | null } | null;
  carData?: ChatCar | null;
  lastMessageText?: string | null;
  lastSenderId?: string | null;
  lastMessageAt: string;
  myUnread: number;
  partnerReadAt?: string | null;
}

export interface PrivateMessageItem {
  _id: string;
  conversationId: string;
  senderId: string;
  messageType: string;
  messageText?: string | null;
  messageImage?: string | null;
  carId?: string | null;
  carData?: ChatCar | null;
  createdAt: string;
}
