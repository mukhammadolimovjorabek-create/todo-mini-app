import sys

with open("src/components/ScreenAnalytics.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add getTelegramUser import
content = content.replace("import { triggerHaptic } from '../utils/telegram';", "import { triggerHaptic, getTelegramUser } from '../utils/telegram';")

# Change useState
old_state = "const [friendsList] = useState<InvitedFriend[]>(loadFriends());"
new_state = """const [friendsList, setFriendsList] = useState<InvitedFriend[]>(loadFriends());

  React.useEffect(() => {
    const fetchRealFriends = async () => {
      try {
        const user = getTelegramUser();
        const userId = user?.id;
        if (!userId) return;
        
        // Localhostdagi Python bot API dan do'stlarni olish
        const res = await fetch(`http://localhost:8000/api/friends?user_id=${userId}`);
        const data = await res.json();
        
        if (data.friends && Array.isArray(data.friends)) {
          setFriendsList(data.friends);
          // Mahalliy xotiraga ham saqlab qo'yamiz (offline qismi uchun)
          localStorage.setItem("todo_friends_v1", JSON.stringify(data.friends));
        }
      } catch (e) {
        console.error("API dan do'stlarni olishda xatolik:", e);
      }
    };
    
    fetchRealFriends();
  }, []);"""

content = content.replace(old_state, new_state)

with open("src/components/ScreenAnalytics.tsx", "w", encoding="utf-8") as f:
    f.write(content)
