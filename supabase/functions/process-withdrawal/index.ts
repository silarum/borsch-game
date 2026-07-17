Deno.serve(() => new Response(JSON.stringify({
    error: 'feature_disabled',
    message: 'Вывод отключён до запуска проверенного финансового backend.'
}), {
    status: 410,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
}));
