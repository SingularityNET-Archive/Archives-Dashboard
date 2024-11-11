// ../components/nav.tsx
import Link from 'next/link';
import axios from 'axios';
import { useState, useEffect } from "react";
import { supabase } from '../lib/supabaseClient';
import { Session } from "@supabase/supabase-js";
import { useMyVariable } from '../context/MyVariableContext';
import { saveUser } from '../utils/saveUser';
import { fetchLatestTag } from '../utils/fetchLatestTag';
import styles from '../styles/nav.module.css';

type RoleData = {
  roles: {
    [key: string]: string;
  };
  userRoles: string[];
  isAdmin: boolean;  
  discordRoles: string[];
  appRole: string;
};

const Nav = () => {
  const [session, setSession] = useState<Session | null>(null)
  const [roleData, setRoleData] = useState<RoleData | null>(null);
  const { myVariable, setMyVariable } = useMyVariable();
  const [latestTag, setLatestTag] = useState<string>('');
  
  async function getTags() {
    const tag = await fetchLatestTag();
    setLatestTag(tag);
  }

  useEffect(() => {
    getTags();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setMyVariable(prevState => ({
        ...prevState,
        isLoggedIn: !!session 
      }));
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setMyVariable(prevState => ({
        ...prevState,
        isLoggedIn: !!session 
      }));
    })
    
    return () => subscription.unsubscribe()
  }, [])

    async function signInWithDiscord() {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: 'https://archive-oracle.netlify.app/submit-meeting-summary',
        },
      })
    }
  
    async function signout() {
      const { error } = await supabase.auth.signOut()
    }

   useEffect(() => {
    // Guard clause: return if session is null
    if (!session) return;
  
    /*const discordUserId = session.user.user_metadata.sub;
    const guildId = '919622034546372679';
  
    axios.get(`/api/userRoles?userId=${discordUserId}&guildId=${guildId}`)
    .then(response => {
      if (response.status !== 200) {
        throw new Error('Network response was not ok');
      }*/
      saveUsername();
      const userId = session.user.id;
      axios.get(`/api/userRoles?userId=${userId}`)
      .then(response => {
        if (response.status !== 200) {
          throw new Error('Network response was not ok');
        }
      setMyVariable(prevState => ({
        ...prevState,
        roles: response.data,
        currentUser: session?.user.user_metadata?.full_name
      }));
      setRoleData(prevState => {
        if (prevState) {
          return {
            roles: prevState.roles,
            userRoles: prevState.userRoles,
            isAdmin: response.data.isAdmin,
            discordRoles: response.data.discordRoles,
            appRole: response.data.appRole
          };
        } else {
          // Assuming default values for roles and userRoles
          return {
            roles: {},
            userRoles: [],
            isAdmin: response.data.isAdmin,
            discordRoles: response.data.discordRoles,
            appRole: response.data.appRole
          };
        }
      });
    })
    .catch(error => console.error('Error:', error));
  }, [session]);  

  async function saveUsername() {
    const data = await saveUser(session?.user.user_metadata);
  }

  return (
    <nav className={styles.routes}>
      <div className={styles.navLeft}>
        <Link href="/" className={styles.navitems}>
          Home
        </Link>
        {roleData?.appRole == "admin" && (<>
          <Link href='/admin-tools' className={styles.navitems}>
            Admin Tools
          </Link>
        </>
        )}
      </div>
      <div>{latestTag}</div>
      <div>
        {!session && (
          <button onClick={signInWithDiscord} className={styles.navitems}>
            Sign In with Discord
          </button>)}
        {session && (
          <button onClick={signout} className={styles.navitems}>
            Sign Out
          </button>)}
      </div>
    </nav>
  );
};

export default Nav;