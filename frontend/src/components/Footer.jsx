import { Link } from "react-router-dom";
import {
	Alignment,
	Navbar as BpNavbar,
	NavbarGroup,
	NavbarHeading,
} from "@blueprintjs/core";
import { Button } from "./ui/Button";

/** @param {{ isAuthenticated: boolean }} props */
export function Footer({ isAuthenticated }) {
	return (
		<footer className="border-t border-black/10 bg-white/70 dark:border-white/10 dark:bg-[#252a33]">
			<BpNavbar className="!bg-transparent !shadow-none">
				<div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3 px-4 sm:px-6 lg:px-8">
					<NavbarGroup align={Alignment.START} className="min-w-0 flex-1">
						<NavbarHeading className="!mr-2 shrink-0 !text-sm">SkillTrack</NavbarHeading>
						<span className="bp6-text-muted hidden truncate text-xs sm:inline">
							Skills, courses, and career outcomes in one place.
						</span>
					</NavbarGroup>

					{!isAuthenticated && (
						<NavbarGroup align={Alignment.END} className="shrink-0 gap-2">
							<Link to="/login">
								<Button variant="minimal" size="sm">
									Log In
								</Button>
							</Link>
							<Link to="/register">
								<Button variant="primary" size="sm">
									Register
								</Button>
							</Link>
						</NavbarGroup>
					)}

					<NavbarGroup align={Alignment.END} className="shrink-0">
						<span className="bp6-text-muted text-xs">© {new Date().getFullYear()} SkillTrack</span>
					</NavbarGroup>
				</div>
			</BpNavbar>
		</footer>
	);
}
