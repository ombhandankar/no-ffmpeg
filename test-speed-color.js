const { Processor } = require('no-ffmpeg');

async function testSpeed() {
  console.log('Testing speed operation...');
  const processor = new Processor();
  
  try {
    await processor
      .input('input.mp4')
      .speed(1.5) // Make video 1.5x faster
      .output('output-speed-1.5x.mp4')
      .execute();
    
    console.log('Speed operation test completed successfully!');
  } catch (error) {
    console.error('Speed operation test failed:', error);
  }
}

async function testAdjustColor() {
  console.log('Testing color adjustment operation...');
  const processor = new Processor();
  
  try {
    await processor
      .input('input.mp4')
      .adjustColor({ 
        brightness: 0.2,
        contrast: 1.2,
        saturation: 1.3
      })
      .output('output-color-adjusted.mp4')
      .execute();
    
    console.log('Color adjustment test completed successfully!');
  } catch (error) {
    console.error('Color adjustment test failed:', error);
  }
}

async function testSlowMotion() {
  console.log('Testing slow motion effect...');
  const processor = new Processor();
  
  try {
    await processor
      .input('input.mp4')
      .speed(0.5) // Slow down to half speed
      .adjustColor({ saturation: 1.2 }) // Slightly enhance colors
      .output('output-slow-motion.mp4')
      .execute();
    
    console.log('Slow motion test completed successfully!');
  } catch (error) {
    console.error('Slow motion test failed:', error);
  }
}

async function testComplexCombination() {
  console.log('Testing complex combined operations...');
  const processor = new Processor();
  
  try {
    await processor
      .input('input.mp4')
      // First trim the video
      .trim({ 
        start: 5,
        duration: 10
      })
      // Adjust the speed
      .speed(1.25)
      // Enhance colors for a more vibrant look
      .adjustColor({
        brightness: 0.05,
        contrast: 1.1,
        saturation: 1.2
      })
      // Add text overlay
      .text({
        text: 'Enhanced Video',
        position: 'BOTTOM',
        fontSize: 36,
        fontColor: 'white',
        backgroundColor: 'black@0.5'
      })
      .output('output-enhanced.mp4')
      .execute();
    
    console.log('Complex combined operations test completed successfully!');
  } catch (error) {
    console.error('Complex combined operations test failed:', error);
  }
}

// Run all tests
async function runAllTests() {
  console.log('Starting tests...\n');
  
  await testSpeed();
  console.log('\n-------------------\n');
  
  await testAdjustColor();
  console.log('\n-------------------\n');
  
  await testSlowMotion();
  console.log('\n-------------------\n');
  
  await testComplexCombination();
  console.log('\n-------------------\n');
  
  console.log('All tests completed!');
}

// Run the tests
runAllTests().catch(console.error); 