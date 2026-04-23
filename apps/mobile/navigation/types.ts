export type RootStackParamList = {
  Sites: undefined;
  SiteDetail: { siteId: string };
  TaskList: { shiftId: string; siteName: string; siteId: string };
  TaskDetail: { taskId: string };
  ClockOut: { shiftId: string };
  IncidentReport: { siteId: string; siteName: string };
};
