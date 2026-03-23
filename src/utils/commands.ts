import packageJson from "../../package.json";
import themes from "../../themes.json";
import { history } from "../stores/history";
import { theme } from "../stores/theme";
import { todoManager } from "./todo";

const hostname = window.location.hostname;
const githubUsername = 'mendax0110';
const githubApiBase = 'https://api.github.com';
const linkedinUrl = 'https://www.linkedin.com/in/adrian-g%C3%B6ssl-480a7b202/';

interface GithubUser {
  login: string;
  html_url: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  bio: string | null;
  avatar_url: string;
}

interface GithubRepo {
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
}

interface GithubEvent {
  type: string;
  repo: {
    name: string;
  };
  created_at: string;
  payload: {
    ref?: string | null;
    commits?: Array<{ message: string }>;
  };
}

const fetchGithubJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
};

export const commands: Record<string, (args: string[]) => Promise<string> | string> = {
  help: () => {
    const categories = {
      System: ["help", "clear", "date", "exit"],
      Profile: ["start", "github", "contributions"],
      Productivity: ["todo", "weather"],
      Customization: ["theme", "banner"],
      Network: ["curl", "hostname", "whoami"],
      Contact: ["email", "repo", "linkedin", "donate"],
      Fun: ["echo", "sudo", "vi", "vim", "emacs"],
    };

    let output = "Available commands:\n\n";

    for (const [category, cmds] of Object.entries(categories)) {
      output += `${category}:\n`;
      output += cmds.map((cmd) => `  ${cmd}`).join("\n");
      output += "\n\n";
    }

    output +=
      'Type "[command] help" or "[command]" without args for more info.';

    return output;
  },
  hostname: () => hostname,
  whoami: () => "guest",
  date: () => new Date().toLocaleString(),
  vi: () => `why use vi? try 'emacs'`,
  vim: () => `why use vim? try 'emacs'`,
  emacs: () => `why use emacs? try 'vim'`,
  echo: (args: string[]) => args.join(" "),
  sudo: (args: string[]) => {
    window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

    return `Permission denied: unable to run the command '${args[0]}' as root.`;
  },
  theme: (args: string[]) => {
    const usage = `Usage: theme [args].
    [args]:
      ls: list all available themes
      set: set theme to [theme]

    [Examples]:
      theme ls
      theme set gruvboxdark
    `;
    if (args.length === 0) {
      return usage;
    }

    switch (args[0]) {
      case "ls": {
        let result = themes.map((t) => t.name.toLowerCase()).join(", ");
        result += `You can preview all these themes here: ${packageJson.repository.url}/tree/master/docs/themes`;

        return result;
      }

      case "set": {
        if (args.length !== 2) {
          return usage;
        }

        const selectedTheme = args[1];
        const t = themes.find((t) => t.name.toLowerCase() === selectedTheme);

        if (!t) {
          return `Theme '${selectedTheme}' not found. Try 'theme ls' to see all available themes.`;
        }

        theme.set(t);

        return `Theme set to ${selectedTheme}`;
      }

      default: {
        return usage;
      }
    }
  },
  repo: () => {
    window.open(packageJson.repository.url, "_blank");

    return "Opening repository...";
  },
  clear: () => {
    history.set([]);

    return "";
  },
  email: () => {
    window.open(`mailto:${packageJson.author.email}`);

    return `Opening mailto:${packageJson.author.email}...`;
  },
  donate: () => {
    window.open(packageJson.funding.url, "_blank");
  linkedin: () => {
    window.open(linkedinUrl, "_blank");

    return "Opening LinkedIn profile...";
  },

    return "Opening donation url...";
  },
  weather: async (args: string[]) => {
    const city = args.join("+");

    if (!city) {
      return "Usage: weather [city]. Example: weather Brussels";
    }

    const weather = await fetch(`https://wttr.in/${city}?ATm`);

    return weather.text();
  },
  exit: () => {
    return "Please close the tab to exit.";
  },
  curl: async (args: string[]) => {
    if (args.length === 0) {
      return "curl: no URL provided";
    }

    const url = args[0];

    try {
      const response = await fetch(url);
      const data = await response.text();

      return data;
    } catch (error) {
      return `curl: could not fetch URL ${url}. Details: ${error}`;
    }
  },
  banner: () => `
███╗   ███╗███████╗███╗   ██╗██████╗  █████╗ ██╗  ██╗
████╗ ████║██╔════╝████╗  ██║██╔══██╗██╔══██╗╚██╗██╔╝
██╔████╔██║█████╗  ██╔██╗ ██║██║  ██║███████║ ╚███╔╝
██║╚██╔╝██║██╔══╝  ██║╚██╗██║██║  ██║██╔══██║ ██╔██╗
██║ ╚═╝ ██║███████╗██║ ╚████║██████╔╝██║  ██║██╔╝ ██╗
╚═╝     ╚═╝╚══════╝╚═╝  ╚═══╝╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝ v${packageJson.version}

MENDAX0110

Type 'help' to see list of available commands.
`,
  start: () => `Name: mendax
Role: Embedded Software Engineer
Focus: C++, C, C#, Python
Learning: hackthebox, malware analysis, reverse engineering, cyber security
Collab: radio telescope project
Interests: electronics, IoT, AI, microcontrollers, embedded systems
Contact: ${linkedinUrl}`,
  todo: (args: string[]) => {
    const usage = `Usage: todo [command] [args]

Commands:
  add <text>     Add a new todo
  ls [filter]    List todos (filter: all, completed, pending)
  done <id>      Mark todo as completed
  rm <id>        Remove a todo
  clear [completed]  Clear todos (add 'completed' to clear only completed)
  stats          Show todo statistics

Examples:
  todo add Buy groceries
  todo ls
  todo ls pending
  todo done 1
  todo rm 2
  todo clear completed`;

    if (args.length === 0) {
      return usage;
    }

    const [subCommand, ...subArgs] = args;

    switch (subCommand) {
      case "add":
        if (subArgs.length === 0) {
          return "Error: Please provide todo text. Example: todo add Buy milk";
        }
        return todoManager.add(subArgs.join(" "));

      case "ls":
      case "list":
        const filter = subArgs[0] as
          | "all"
          | "completed"
          | "pending"
          | undefined;
        if (filter && !["all", "completed", "pending"].includes(filter)) {
          return "Error: Invalid filter. Use: all, completed, or pending";
        }
        return todoManager.list(filter);

      case "done":
      case "complete":
        const completeId = parseInt(subArgs[0]);
        if (isNaN(completeId)) {
          return "Error: Please provide a valid todo ID number";
        }
        return todoManager.complete(completeId);

      case "rm":
      case "remove":
      case "delete":
        const removeId = parseInt(subArgs[0]);
        if (isNaN(removeId)) {
          return "Error: Please provide a valid todo ID number";
        }
        return todoManager.remove(removeId);

      case "clear":
        const onlyCompleted = subArgs[0] === "completed";
        return todoManager.clear(onlyCompleted);

      case "stats":
        return todoManager.stats();

      default:
        return `Unknown todo command: ${subCommand}\n\n${usage}`;
    }
  },
  github: async (args: string[]) => {
    const usage = `Usage: github [command]

Commands:
  profile   Show GitHub profile summary
  repos     Show top repositories
  langs     Show top languages

Examples:
  github profile
  github repos
  github langs`;

    const command = args[0] ?? "profile";

    try {
      const user = await fetchGithubJson<GithubUser>(
        `${githubApiBase}/users/${githubUsername}`
      );
      const repos = await fetchGithubJson<GithubRepo[]>(
        `${githubApiBase}/users/${githubUsername}/repos?per_page=100&sort=updated`
      );

      const languageCounts = repos.reduce<Record<string, number>>(
        (acc, repo) => {
          if (repo.language) {
            acc[repo.language] = (acc[repo.language] ?? 0) + 1;
          }
          return acc;
        },
        {}
      );

      const topLanguages = Object.entries(languageCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([language, count]) => `${language} (${count})`)
        .join(", ") || "N/A";

      const topRepos = [...repos]
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 8)
        .map(
          (repo) =>
            `${repo.name} (${repo.stargazers_count}★, ${repo.forks_count} forks)`
        )
        .join("\n  ") || "N/A";

      const recentRepos = [...repos]
        .sort(
          (a, b) =>
            new Date(b.updated_at).getTime() -
            new Date(a.updated_at).getTime()
        )
        .slice(0, 8)
        .map(
          (repo) =>
            `${repo.name} (${new Date(repo.updated_at).toLocaleDateString()})`
        )
        .join("\n  ") || "N/A";

      if (command === "profile") {
        return `GitHub: ${user.html_url}
User: ${user.login}
Public repos: ${user.public_repos}
Followers: ${user.followers}
Following: ${user.following}
Bio: ${user.bio ?? "N/A"}
Top languages: ${topLanguages}`;
      }

      if (command === "repos") {
        return `Top starred repos:\n  ${topRepos}\n\nRecently updated:\n  ${recentRepos}`;
      }

      if (command === "langs") {
        return `Top languages: ${topLanguages}`;
      }

      return usage;
    } catch (error) {
      return `GitHub lookup failed. Try again later.`;
    }
  },
  contributions: async () => {
    try {
      const events = await fetchGithubJson<GithubEvent[]>(
        `${githubApiBase}/users/${githubUsername}/events/public?per_page=30`
      );

      if (events.length === 0) {
        return "No public activity found.";
      }

      const summaries = events.slice(0, 10).map((event) => {
        const date = new Date(event.created_at).toLocaleDateString();
        const commitMessage = event.payload.commits?.[0]?.message;
        const detail = commitMessage ? ` - ${commitMessage}` : "";

        return `${date} ${event.type} ${event.repo.name}${detail}`;
      });

      return `Recent public activity:\n  ${summaries.join("\n  ")}`;
    } catch (error) {
      return "GitHub activity lookup failed. Try again later.";
    }
  },
};
