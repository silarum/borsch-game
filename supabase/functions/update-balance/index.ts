Deno.serve(() => new Response(JSON.stringify({
    error: 'feature_disabled',
    message: 'Клиентское изменение баланса запрещено.'
}), {
    status: 410,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
}));
