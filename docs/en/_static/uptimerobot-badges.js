/**
 * Orchestrates global batch fetching from UptimeRobot using a single Read-Only API Key.
 * Minimizes network request footprint to protect rate limits (20 req/min).
 */
document.addEventListener("DOMContentLoaded", () => {
    const apiKey = window.UPTIMEROBOT_API_KEY;
    if (!apiKey) {
        console.error("[UptimeRobot]: Global Read-Only API Key is not configured in conf.py");
        return;
    }

    const monitorNodes = document.querySelectorAll(".ur-monitor-row");
    if (monitorNodes.length === 0) return;

    const url = "https://api.uptimerobot.com/v2/getMonitors";
    const bodyParams = "api_key=" + apiKey + "&format=json&custom_uptime_ratios=1-7-30";

    fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: bodyParams
    })
    .then(response => {
        if (!response.ok) throw new Error("HTTP error status " + response.status);
        return response.json();
    })
    .then(data => {
        if (!data || data.stat !== "ok" || !data.monitors) {
            throw new Error("Invalid API response envelope or unauthorized token");
        }

        monitorNodes.forEach(node => {
            const friendlyName = node.getAttribute("data-friendly-name");
            const badgeId = node.getAttribute("data-suffix");

            const targetMonitor = data.monitors.find(m => m.friendly_name === friendlyName);

            const colorEl = document.getElementById("ur-badge-color-" + badgeId);
            const textEl = document.getElementById("ur-badge-text-" + badgeId);
            const txt24h = document.getElementById("pct-24h-" + badgeId);
            const txt7d = document.getElementById("pct-7d-" + badgeId);
            const txt30d = document.getElementById("pct-30d-" + badgeId);

            if (!targetMonitor) {
                if (textEl) textEl.textContent = "NOT FND";
                console.warn(`[UptimeRobot]: Monitor named "${friendlyName}" not found in API response.`);
                return;
            }

            if (colorEl && textEl) {
                const isUp = (targetMonitor.status === 2);
                colorEl.setAttribute("fill", isUp ? "#4c1" : "#e05d44");
                textEl.textContent = isUp ? "OPERATIONAL" : "DOWN";
            }

            if (targetMonitor.custom_uptime_ratio) {
                const ratios = targetMonitor.custom_uptime_ratio.split('-');

                if (txt24h) txt24h.textContent = parseFloat(ratios[0]).toFixed(2) + "%";
                if (txt7d)  txt7d.textContent  = parseFloat(ratios[1]).toFixed(2) + "%";
                if (txt30d) txt30d.textContent = parseFloat(ratios[2]).toFixed(2) + "%";

                [txt24h, txt7d, txt30d].forEach((el, idx) => {
                    if (el && parseFloat(ratios[idx]) < 99.0) {
                        el.style.color = "#e05d44";
                        el.style.fontWeight = "bold";
                    }
                });
            }
        });
    })
    .catch(error => {
        console.error("[UptimeRobot Batch Engine Error]:", error);
        monitorNodes.forEach(node => {
            const badgeId = node.getAttribute("data-suffix");
            const textEl = document.getElementById("ur-badge-text-" + badgeId);
            if (textEl) textEl.textContent = "ERR";
        });
    });
});
