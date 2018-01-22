// @flow

export type TAction = { type: string, payload?: any };
export type TDispatch = (TAction) => any;
export type TAdyaUser = { id: string };
export type TAdyaPermission = { user_id: string, accessType: string };
export type TAdyaFile = {
  file_id: string,
  file_name: string,
  file_type: string,
  access_list: TAdyaPermission[],
  depth?: number
};
