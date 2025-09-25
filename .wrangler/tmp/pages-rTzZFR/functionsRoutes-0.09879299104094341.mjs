import { onRequestPost as __api_admin_photos__id__approve_ts_onRequestPost } from "C:\\Users\\zachh\\Non_SchoolRelatedCode\\thehoffmans.wedding\\functions\\api\\admin\\photos\\[id]\\approve.ts"
import { onRequestPost as __api_admin_photos__id__reject_ts_onRequestPost } from "C:\\Users\\zachh\\Non_SchoolRelatedCode\\thehoffmans.wedding\\functions\\api\\admin\\photos\\[id]\\reject.ts"
import { onRequestGet as __api_admin_export_latest_rsvps_ts_onRequestGet } from "C:\\Users\\zachh\\Non_SchoolRelatedCode\\thehoffmans.wedding\\functions\\api\\admin\\export\\latest-rsvps.ts"
import { onRequestDelete as __api_admin_photos__id__ts_onRequestDelete } from "C:\\Users\\zachh\\Non_SchoolRelatedCode\\thehoffmans.wedding\\functions\\api\\admin\\photos\\[id].ts"
import { onRequestOptions as __api_admin_photos__id__ts_onRequestOptions } from "C:\\Users\\zachh\\Non_SchoolRelatedCode\\thehoffmans.wedding\\functions\\api\\admin\\photos\\[id].ts"
import { onRequestDelete as __api_admin_reminders__title__ts_onRequestDelete } from "C:\\Users\\zachh\\Non_SchoolRelatedCode\\thehoffmans.wedding\\functions\\api\\admin\\reminders\\[title].ts"
import { onRequestPatch as __api_admin_reminders__title__ts_onRequestPatch } from "C:\\Users\\zachh\\Non_SchoolRelatedCode\\thehoffmans.wedding\\functions\\api\\admin\\reminders\\[title].ts"
import { onRequest as __api_admin_member__id__ts_onRequest } from "C:\\Users\\zachh\\Non_SchoolRelatedCode\\thehoffmans.wedding\\functions\\api\\admin\\member\\[id].ts"
import { onRequest as __api_admin_party__id__ts_onRequest } from "C:\\Users\\zachh\\Non_SchoolRelatedCode\\thehoffmans.wedding\\functions\\api\\admin\\party\\[id].ts"
import { onRequestPost as __api_party__id__submit_ts_onRequestPost } from "C:\\Users\\zachh\\Non_SchoolRelatedCode\\thehoffmans.wedding\\functions\\api\\party\\[id]\\submit.ts"
import { onRequestPost as __api_admin_member_index_ts_onRequestPost } from "C:\\Users\\zachh\\Non_SchoolRelatedCode\\thehoffmans.wedding\\functions\\api\\admin\\member\\index.ts"
import { onRequestGet as __api_admin_missing_ts_onRequestGet } from "C:\\Users\\zachh\\Non_SchoolRelatedCode\\thehoffmans.wedding\\functions\\api\\admin\\missing.ts"
import { onRequestGet as __api_admin_overview_ts_onRequestGet } from "C:\\Users\\zachh\\Non_SchoolRelatedCode\\thehoffmans.wedding\\functions\\api\\admin\\overview.ts"
import { onRequestGet as __api_admin_parties_ts_onRequestGet } from "C:\\Users\\zachh\\Non_SchoolRelatedCode\\thehoffmans.wedding\\functions\\api\\admin\\parties.ts"
import { onRequestGet as __api_admin_photos_ts_onRequestGet } from "C:\\Users\\zachh\\Non_SchoolRelatedCode\\thehoffmans.wedding\\functions\\api\\admin\\photos.ts"
import { onRequestGet as __api_admin_reminder_log_ts_onRequestGet } from "C:\\Users\\zachh\\Non_SchoolRelatedCode\\thehoffmans.wedding\\functions\\api\\admin\\reminder-log.ts"
import { onRequestGet as __api_admin_reminders_ts_onRequestGet } from "C:\\Users\\zachh\\Non_SchoolRelatedCode\\thehoffmans.wedding\\functions\\api\\admin\\reminders.ts"
import { onRequestPost as __api_admin_reminders_ts_onRequestPost } from "C:\\Users\\zachh\\Non_SchoolRelatedCode\\thehoffmans.wedding\\functions\\api\\admin\\reminders.ts"
import { onRequestGet as __api_admin_settings_ts_onRequestGet } from "C:\\Users\\zachh\\Non_SchoolRelatedCode\\thehoffmans.wedding\\functions\\api\\admin\\settings.ts"
import { onRequestPost as __api_admin_settings_ts_onRequestPost } from "C:\\Users\\zachh\\Non_SchoolRelatedCode\\thehoffmans.wedding\\functions\\api\\admin\\settings.ts"
import { onRequestGet as __api_admin_submissions_ts_onRequestGet } from "C:\\Users\\zachh\\Non_SchoolRelatedCode\\thehoffmans.wedding\\functions\\api\\admin\\submissions.ts"
import { onRequestPost as __api_gallery_confirm_ts_onRequestPost } from "C:\\Users\\zachh\\Non_SchoolRelatedCode\\thehoffmans.wedding\\functions\\api\\gallery\\confirm.ts"
import { onRequestPost as __api_gallery_direct_upload_ts_onRequestPost } from "C:\\Users\\zachh\\Non_SchoolRelatedCode\\thehoffmans.wedding\\functions\\api\\gallery\\direct-upload.ts"
import { onRequestGet as __api_gallery_file_ts_onRequestGet } from "C:\\Users\\zachh\\Non_SchoolRelatedCode\\thehoffmans.wedding\\functions\\api\\gallery\\file.ts"
import { onRequest as __api_admin_member_index_ts_onRequest } from "C:\\Users\\zachh\\Non_SchoolRelatedCode\\thehoffmans.wedding\\functions\\api\\admin\\member\\index.ts"
import { onRequest as __api_party_search_ts_onRequest } from "C:\\Users\\zachh\\Non_SchoolRelatedCode\\thehoffmans.wedding\\functions\\api\\party\\search.ts"
import { onRequestGet as __api_party__id__index_ts_onRequestGet } from "C:\\Users\\zachh\\Non_SchoolRelatedCode\\thehoffmans.wedding\\functions\\api\\party\\[id]\\index.ts"
import { onRequestGet as __api_gallery_index_ts_onRequestGet } from "C:\\Users\\zachh\\Non_SchoolRelatedCode\\thehoffmans.wedding\\functions\\api\\gallery\\index.ts"
import { onRequestGet as __api_health_ts_onRequestGet } from "C:\\Users\\zachh\\Non_SchoolRelatedCode\\thehoffmans.wedding\\functions\\api\\health.ts"
import { onRequest as __api_reminders_ts_onRequest } from "C:\\Users\\zachh\\Non_SchoolRelatedCode\\thehoffmans.wedding\\functions\\api\\reminders.ts"

export const routes = [
    {
      routePath: "/api/admin/photos/:id/approve",
      mountPath: "/api/admin/photos/:id",
      method: "POST",
      middlewares: [],
      modules: [__api_admin_photos__id__approve_ts_onRequestPost],
    },
  {
      routePath: "/api/admin/photos/:id/reject",
      mountPath: "/api/admin/photos/:id",
      method: "POST",
      middlewares: [],
      modules: [__api_admin_photos__id__reject_ts_onRequestPost],
    },
  {
      routePath: "/api/admin/export/latest-rsvps",
      mountPath: "/api/admin/export",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_export_latest_rsvps_ts_onRequestGet],
    },
  {
      routePath: "/api/admin/photos/:id",
      mountPath: "/api/admin/photos",
      method: "DELETE",
      middlewares: [],
      modules: [__api_admin_photos__id__ts_onRequestDelete],
    },
  {
      routePath: "/api/admin/photos/:id",
      mountPath: "/api/admin/photos",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_admin_photos__id__ts_onRequestOptions],
    },
  {
      routePath: "/api/admin/reminders/:title",
      mountPath: "/api/admin/reminders",
      method: "DELETE",
      middlewares: [],
      modules: [__api_admin_reminders__title__ts_onRequestDelete],
    },
  {
      routePath: "/api/admin/reminders/:title",
      mountPath: "/api/admin/reminders",
      method: "PATCH",
      middlewares: [],
      modules: [__api_admin_reminders__title__ts_onRequestPatch],
    },
  {
      routePath: "/api/admin/member/:id",
      mountPath: "/api/admin/member",
      method: "",
      middlewares: [],
      modules: [__api_admin_member__id__ts_onRequest],
    },
  {
      routePath: "/api/admin/party/:id",
      mountPath: "/api/admin/party",
      method: "",
      middlewares: [],
      modules: [__api_admin_party__id__ts_onRequest],
    },
  {
      routePath: "/api/party/:id/submit",
      mountPath: "/api/party/:id",
      method: "POST",
      middlewares: [],
      modules: [__api_party__id__submit_ts_onRequestPost],
    },
  {
      routePath: "/api/admin/member",
      mountPath: "/api/admin/member",
      method: "POST",
      middlewares: [],
      modules: [__api_admin_member_index_ts_onRequestPost],
    },
  {
      routePath: "/api/admin/missing",
      mountPath: "/api/admin",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_missing_ts_onRequestGet],
    },
  {
      routePath: "/api/admin/overview",
      mountPath: "/api/admin",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_overview_ts_onRequestGet],
    },
  {
      routePath: "/api/admin/parties",
      mountPath: "/api/admin",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_parties_ts_onRequestGet],
    },
  {
      routePath: "/api/admin/photos",
      mountPath: "/api/admin",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_photos_ts_onRequestGet],
    },
  {
      routePath: "/api/admin/reminder-log",
      mountPath: "/api/admin",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_reminder_log_ts_onRequestGet],
    },
  {
      routePath: "/api/admin/reminders",
      mountPath: "/api/admin",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_reminders_ts_onRequestGet],
    },
  {
      routePath: "/api/admin/reminders",
      mountPath: "/api/admin",
      method: "POST",
      middlewares: [],
      modules: [__api_admin_reminders_ts_onRequestPost],
    },
  {
      routePath: "/api/admin/settings",
      mountPath: "/api/admin",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_settings_ts_onRequestGet],
    },
  {
      routePath: "/api/admin/settings",
      mountPath: "/api/admin",
      method: "POST",
      middlewares: [],
      modules: [__api_admin_settings_ts_onRequestPost],
    },
  {
      routePath: "/api/admin/submissions",
      mountPath: "/api/admin",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_submissions_ts_onRequestGet],
    },
  {
      routePath: "/api/gallery/confirm",
      mountPath: "/api/gallery",
      method: "POST",
      middlewares: [],
      modules: [__api_gallery_confirm_ts_onRequestPost],
    },
  {
      routePath: "/api/gallery/direct-upload",
      mountPath: "/api/gallery",
      method: "POST",
      middlewares: [],
      modules: [__api_gallery_direct_upload_ts_onRequestPost],
    },
  {
      routePath: "/api/gallery/file",
      mountPath: "/api/gallery",
      method: "GET",
      middlewares: [],
      modules: [__api_gallery_file_ts_onRequestGet],
    },
  {
      routePath: "/api/admin/member",
      mountPath: "/api/admin/member",
      method: "",
      middlewares: [],
      modules: [__api_admin_member_index_ts_onRequest],
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
      routePath: "/api/gallery",
      mountPath: "/api/gallery",
      method: "GET",
      middlewares: [],
      modules: [__api_gallery_index_ts_onRequestGet],
    },
  {
      routePath: "/api/health",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_health_ts_onRequestGet],
    },
  {
      routePath: "/api/reminders",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_reminders_ts_onRequest],
    },
  ]