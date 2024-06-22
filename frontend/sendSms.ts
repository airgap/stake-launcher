import {settings} from "./reactSettingsStore";

export const sendSms = (balance: number) => {
    if(!settings?.apiKey) throw new Error('No API key available');
    const requestOptions = {
        method: "POST",
        body: JSON.stringify({
            API_KEY: settings?.apiKey,
            BALANCE: balance,
        }),
        headers: { "Content-Type": "application/json" },
    };
    fetch(
        "https://stanking-fart.ip4.workers.dev/report_balance",
        requestOptions,
    )
        .then((response) => response.json())
        .then((data) => console.log(data))
        .catch((error) => console.error("Error:", error));
}