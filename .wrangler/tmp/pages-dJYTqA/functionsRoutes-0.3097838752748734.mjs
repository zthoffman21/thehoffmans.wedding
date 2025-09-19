import { onRequestGet as __api_admin_export_latest_rsvps_ts_onRequestGet } from "C:\\Users\\zachh\\Non_SchoolRelatedCode\\thehoffmans.wedding\\functions\\api\\admin\\export\\latest-rsvps.ts"
import { onRequestPost as __api_party__id__submit_ts_onRequestPost } from "C:\\Users\\zachh\\Non_SchoolRelatedCode\\thehoffmans.wedding\\functions\\api\\party\\[id]\\submit.ts"
import { onRequest as __api_party_search_ts_onRequest } from "C:\\Users\\zachh\\Non_SchoolRelatedCode\\thehoffmans.wedding\\functions\\api\\party\\search.ts"
import { onRequestGet as __api_party__id__index_ts_onRequestGet } from "C:\\Users\\zachh\\Non_SchoolRelatedCode\\thehoffmans.wedding\\functions\\api\\party\\[id]\\index.ts"
import { onRequestGet as __api_health_ts_onRequestGet } from "C:\\Users\\zachh\\Non_SchoolRelatedCode\\thehoffmans.wedding\\functions\\api\\health.ts"

export const routes = [
    {
      routePath: "/api/admin/export/latest-rsvps",
      mountPath: "/api/admin/export",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_export_latest_rsvps_ts_onRequestGet],
    },
  {
      routePath: "/api/party/:id/submit",
      mountPath: "/api/party/:id",
      method: "POST",
      middlewares: [],
      modules: [__api_party__id__submit_ts_onRequestPost],
    },
  {
      routePath: "/api/party/search",
      mountPath: "/api/party",
      method: "",
      middlewares: [],
      modules: [__api_party_search_ts_onRequest],
    },
  {
      routePath: "/api/party/:id",
      mountPath: "/api/party/:id",
      method: "GET",
      middlewares: [],
      modules: [__api_party__id__index_ts_onRequestGet],
    },
  {
      routePath: "/api/health",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_health_ts_onRequestGet],
    },
  ]