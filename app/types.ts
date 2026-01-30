
export type USERITEM = {
    MEMBER_NO: number;
    MEMBER_NAME: string;
    GROUP_NAME: string;
    DEPARTMENT: string;
    AFFILIATION: string;
    prize_id : number | null;
    prize_name : string | null;
};

export interface PRIZEITEM {
    prize_id: number;
    prize_name: string;
    prize_qty: number;
};

export interface USERWINNER  {
    row_num : number;
    MEMBER_NO: number;
    MEMBER_NAME: string;
    prize_name : string | null;
    ENTRY_DATE:string;
};