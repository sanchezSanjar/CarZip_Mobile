import { gql } from '@apollo/client';

/** a page of cars for sale, newest first (backend API.md §7) */
export const GET_CARS = gql`
  query GetCars($input: CarsInquiry!) {
    getCars(input: $input) {
      list {
        _id
        carTitle
        carYear
        carMileage
        carPrice
        carPriceUsd
        carImages
        agentData {
          memberNick
          agentCompany
        }
      }
      nextCursor
    }
  }
`;

export interface CarListItem {
  _id: string;
  carTitle: string;
  carYear: number;
  carMileage: number;
  carPrice?: number | null;
  carPriceUsd?: number | null;
  carImages: string[];
  agentData?: { memberNick: string; agentCompany?: string | null } | null;
}

export interface GetCarsData {
  getCars: { list: CarListItem[]; nextCursor?: string | null };
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
