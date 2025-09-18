export const onRequestGet: PagesFunction = async () => {
  return new Response(JSON.stringify({ ok: true, msg: "Functions are live" }), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
};
