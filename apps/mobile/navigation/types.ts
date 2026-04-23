export type RootStackParamList = {
  Sites: undefined;
  SiteDetail: { siteId: string };
  TaskList: { shiftId: string; siteName: string };
  TaskDetail: { taskId: string };
  ClockOut: { shiftId: string };
};
