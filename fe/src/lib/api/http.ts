import SERVER_URL from ".";

const doRequest = (
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE",
    headers?: any,
    payload?: any,
    [other: string]: any,
  }
) => {
  return new Promise<any>((resolve, reject) => {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
      if (this.readyState == 4) {
        if (this.status < 400) resolve(this.response);
        reject();
      }
    };
    xhttp.open(options.method?? "GET", `http://${SERVER_URL}/http/${endpoint}`, true);
    for(let [key, value] of Object.entries<string>(options.headers)) {
      xhttp.setRequestHeader(key, value);
    }
    xhttp.setRequestHeader("Content-type", "application/json");
    if (options.payload) xhttp.send(JSON.stringify(options.payload));
  });
};

export default doRequest;