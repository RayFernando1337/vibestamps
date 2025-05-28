"use client";

import { motion } from "motion/react";
import { CSSProperties, ReactElement, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface Sparkle {
  id: string;
  x: string;
  y: string;
  color: string;
  delay: number;
  scale: number;
  lifespan: number;
}

const Sparkle: React.FC<Sparkle> = ({ id, x, y, color, delay, scale }) => {
  return (
    <motion.svg
      key={id}
      className="pointer-events-none absolute z-20"
      initial={{ opacity: 0, left: x, top: y }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0, scale, 0],
        rotate: [0, 120, 240],
      }}
      transition={{ duration: 2, repeat: Infinity, delay, ease: "easeInOut" }}
      width="24"
      height="24"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 0C12.7333 5.2 14.9333 8.85333 19.6 10.4C14.9333 11.9467 12.7333 15.6 12 20.8C11.2667 15.6 9.06667 11.9467 4.4 10.4C9.06667 8.85333 11.2667 5.2 12 0Z"
        fill={color}
      />
    </motion.svg>
  );
};

interface SparklesTextProps {
  /**
   * @default <div />
   * @type ReactElement
   * @description
   * The component to be rendered as the text
   * */
  as?: ReactElement;

  /**
   * @default ""
   * @type string
   * @description
   * The className of the text
   */
  className?: string;

  /**
   * @required
   * @type string
   * @description
   * The text to be displayed
   * */
  text: string;

  /**
   * @default 10
   * @type number
   * @description
   * The count of sparkles
   * */
  sparklesCount?: number;

  /**
   * @default "{first: '#16a34a', second: '#0ea5e9'}"
   * @type string
   * @description
   * The colors of the sparkles
   * */
  colors?: {
    first: string;
    second: string;
    third?: string;
  };
}

export const SparklesText: React.FC<SparklesTextProps> = ({
  text,
  colors = { first: "#16a34a", second: "#0ea5e9", third: "#f59e0b" },
  className,
  sparklesCount = 12,
  ...props
}) => {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    const generateStar = (): Sparkle => {
      const starX = `${Math.random() * 100}%`;
      const starY = `${Math.random() * 100}%`;

      // Choose randomly between three colors for more variety
      const colorRand = Math.random();
      let color;
      if (colorRand < 0.33) {
        color = colors.first;
      } else if (colorRand < 0.66) {
        color = colors.second;
      } else {
        color = colors.third || colors.first;
      }

      const delay = Math.random() * 3;
      const scale = Math.random() * 0.7 + 0.4; // More consistent but varied sizes
      const lifespan = Math.random() * 12 + 8; // Longer lifespans for a dreamier effect
      const id = `${starX}-${starY}-${Date.now()}`;
      return { id, x: starX, y: starY, color, delay, scale, lifespan };
    };

    const initializeStars = () => {
      const newSparkles = Array.from({ length: sparklesCount }, generateStar);
      setSparkles(newSparkles);
    };

    const updateStars = () => {
      setSparkles((currentSparkles) =>
        currentSparkles.map((star) => {
          if (star.lifespan <= 0) {
            return generateStar();
          } else {
            return { ...star, lifespan: star.lifespan - 0.025 }; // Slower rate of change
          }
        })
      );
    };

    initializeStars();
    const interval = setInterval(updateStars, 250); // Slower interval for dreamier effect

    return () => clearInterval(interval);
  }, [colors.first, colors.second, colors.third, sparklesCount]);

  return (
    <div
      className={cn("text-lg font-semibold text-emerald-800 dark:text-emerald-300", className)}
      {...props}
      style={
        {
          "--sparkles-first-color": `${colors.first}`,
          "--sparkles-second-color": `${colors.second}`,
          "--sparkles-third-color": `${colors.third || colors.first}`,
        } as CSSProperties
      }
    >
      <span className="relative inline-block">
        {sparkles.map((sparkle) => (
          <Sparkle key={sparkle.id} {...sparkle} />
        ))}
        <strong className="relative z-10 drop-shadow-sm">{text}</strong>
      </span>
    </div>
  );
};
