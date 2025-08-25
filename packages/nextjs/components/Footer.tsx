import React from "react";
import Link from "next/link";

export const Footer = () => {
  return (
    <div className="min-h-0 py-5 px-1 mb-11 lg:mb-0 bg-base-200">
      <div className="w-full">
        <ul className="menu menu-horizontal w-full">
          <div className="flex justify-center items-center gap-2 text-sm w-full">
            <div className="text-center">
              <p className="m-0 text-center">
                Built with{" "}
                <Link href="https://scaffoldeth.io/" target="_blank" rel="noreferrer" className="underline underline-offset-2">
                  Scaffold-ETH 2
                </Link>{" "}
                and powered by{" "}
                <Link href="#" className="underline underline-offset-2">
                  MeTTa AI
                </Link>
              </p>
            </div>
          </div>
        </ul>
      </div>
    </div>
  );
};